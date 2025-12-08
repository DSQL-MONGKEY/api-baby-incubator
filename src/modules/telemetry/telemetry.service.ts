import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';

function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

const toNum = (v: any) => (v === null || v === undefined ? null : Number(v));
const toNumArr = (a: any) => (Array.isArray(a) ? a.map((x) => Number(x)) : null);

const toStr = (v: any) => (v === null || v === undefined ? null : String(v));

type TelemetryDTO = {
  id: string;
  ts: Date;
  temp_main: number | null;
  room_humid: number | null;
  fan: number[] | null;
  lamp: number[] | null;
  mode: string | null;
  gpsFix: boolean | null;
  gpsSat: number | null;
  gpsLat: number | null;
  gpsLon: number | null;
  fwVersion: string | null;
  // gunakan string agar tidak kena precision loss kalau BIGINT sangat besar
  rev: string | null;
};

function toTelemetryDTO(row: any): TelemetryDTO {
  return {
    id: row.id,
    ts: row.ts,
    temp_main: toNum(row.temp_main),
    room_humid: toNum(row.room_humid),
    fan: toNumArr(row.fan),
    lamp: toNumArr(row.lamp),
    mode: row.mode ?? null,
    gpsFix: row.gpsFix ?? null,
    gpsSat: toNum(row.gpsSat),
    gpsLat: toNum(row.gpsLat),
    gpsLon: toNum(row.gpsLon),
    fwVersion: row.fwVersion ?? null,
    rev: toStr(row.rev), // <<— aman untuk JSON & overflow
  };
}

@Injectable()
export class TelemetryService {
  constructor(private readonly db: PrismaService) {}

  async latest(incubatorId: string) {
    const inc = await this.db.incubator.findUnique({ where: { id: incubatorId } });
    if (!inc) throw new NotFoundException('incubator not found');

    const row = await this.db.telemetry.findFirst({
      where: { incubator_id: incubatorId },
      orderBy: { ts: 'desc' },
      // pilih field yang kita butuhkan saja
      select: {
        id: true,
        ts: true,
        temp_main: true,
        room_humid: true,
        fan: true,
        lamp: true,
        mode: true,
        gpsFix: true,
        gpsSat: true,
        gpsLat: true,
        gpsLon: true,
        fwVersion: true,
        rev: true, // BIGINT -> kita map jadi string
      },
    });

    return row ? toTelemetryDTO(row) : null;
  }

  async listRaw(
    incubatorId: string,
    q: { from?: string; to?: string; limit?: number; order?: 'asc' | 'desc' },
  ) {
    const inc = await this.db.incubator.findUnique({ where: { id: incubatorId } });
    if (!inc) throw new NotFoundException('incubator not found');

    const from = parseDate(q.from);
    const to = parseDate(q.to);
    const where: Prisma.telemetryWhereInput = {
      incubator_id: incubatorId,
      ...(from || to ? { ts: { gte: from, lte: to } } : {}),
    };

    const orderBy = { ts: (q.order ?? 'desc') as 'asc' | 'desc' };
    const take = q.limit && q.limit > 0 ? q.limit : 500;

    const rows = await this.db.telemetry.findMany({
      where,
      orderBy,
      take,
      select: {
        id: true,
        ts: true,
        temp_main: true,
        room_humid: true,
        fan: true,
        lamp: true,
        mode: true,
        gpsFix: true,
        gpsSat: true,
        gpsLat: true,
        gpsLon: true,
        fwVersion: true,
        rev: true, // BIGINT
      },
    });

    return rows.map(toTelemetryDTO);
  }

  /**
   * Downsample series untuk chart: bucketSec detik, avg(temp_main, room_humid)
   * NB: gunakan $queryRaw agar efisien. Kompatibel dengan Postgres standar (tanpa TimescaleDB).
   */
  async series(incubatorId: string, q: { from: string; to: string; bucket?: string }) {
    const inc = await this.db.incubator.findUnique({ where: { id: incubatorId } });
    if (!inc) throw new NotFoundException('incubator not found');

    const from = parseDate(q.from);
    const to = parseDate(q.to);
    if (!from || !to) throw new Error('from/to required and must be ISO date string');

    const bucketSec = Math.max(5, parseInt(q.bucket || '60', 10) || 60); // default 60s

    // Agregasi per bucket detik: gunakan floor(epoch/ bucket)*bucket
    // Ambil rata2 temperatur & humidity; ambil last mode/fan/lamp via subquery join ts maksimal per bucket (opsional — disederhanakan: abaikan)
    const rows: Array<{
      bucket_ts: Date;
      avg_temp_main: number | null;
      avg_temp_dht: number | null;
      avg_room_humid: number | null;
    }> = await this.db.$queryRaw`
      SELECT
        to_timestamp(floor(extract(epoch from t.ts) / ${bucketSec}) * ${bucketSec}) AS bucket_ts,
        avg(t.temp_main) AS avg_temp_main,
        avg(t.temp_dht) AS avg_temp_dht,
        avg(t.room_humid) AS avg_room_humid
      FROM telemetry t
      WHERE t.incubator_id = ${incubatorId}
        AND t.ts >= ${from}
        AND t.ts <= ${to}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((r) => ({
      ts: r.bucket_ts,
      temp_baby: r.avg_temp_main,
      temp_dht: r.avg_temp_dht,
      rh: r.avg_room_humid
    }));
  }
}
