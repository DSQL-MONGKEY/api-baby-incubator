import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { $Enums } from '@prisma/client';
import { IncubatorsService } from '../incubators/incubators.service';
import { MqttService } from 'src/infra/mqtt/mqtt.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

type TelemetryMsg = {
  v?: number;
  ts?: number | string;
  t?: { ds?: number | null; dht?: number | null; main?: number | null };
  rh?: number | null;
  fan?: number[];              // [0|1, x6]
  mode?: 'AUTO' | 'MANUAL' | 'FORCE_ON' | 'FORCE_OFF';
  lamp?: number[];             // [0|1, x2]
  gps?: { fix?: boolean; sat?: number | null; lat?: number | null; lon?: number | null };
  rev?: number;
  fw?: string;
  raw?: any;
};

function toDate(ts?: number | string): Date {
  if (ts === undefined || ts === null) return new Date();
  if (typeof ts === 'number') {
    // asumsikan detik dari millis()/1000
    return new Date(ts * 1000);
  }
  // ISO string
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
}

@Injectable()
export class TelemetryIngestService implements OnModuleInit {
   private readonly logger = new Logger(TelemetryIngestService.name);

   constructor(
      private readonly mqtt: MqttService,
      private readonly db: PrismaService,
      private readonly incubators: IncubatorsService,
   ) {}

   async onModuleInit() {
      // Subscribe wildcard telemetry
      await this.mqtt.subscribe('/psk/incubator/+/telemetry', 1);
      this.logger.log('Subscribed: /psk/incubator/+/telemetry');
   }

   /**
      * Tangkap semua event mqtt.<topic>, lalu filter topic telemetry.
      * Pastikan EventEmitterModule di-setup dengan wildcard=true.
      */
   @OnEvent('mqtt.**', { async: true })
   async handleMqttEvent(payload: { topic: string; data: string }) {
      const { topic, data } = payload;
      // hanya proses topic telemetry
      // format: /psk/incubator/{code}/telemetry
      if (!topic.startsWith('/psk/incubator/') || !topic.endsWith('/telemetry')) return;

      const seg = topic.split('/'); // ["", "psk", "incubator", "{code}", "telemetry"]
      const code = seg[3];
      if (!code) return;

      // parse JSON
      let msg: TelemetryMsg;
      try {
         msg = JSON.parse(data);
      } catch (e) {
         this.logger.warn(`[ingest] invalid JSON on ${topic}`);
         return;
      }

      // cari incubator by code (unik)
      const inc = await this.db.incubator.findUnique({ where: { code } });
      if (!inc) {
         this.logger.warn(`[ingest] incubator code not found: ${code}`);
         return;
      }

      const ts = toDate(msg.ts);
      // siapkan nilai numerik
      const temp_ds   = msg.t?.ds ?? null;
      const temp_dht  = msg.t?.dht ?? null;
      const temp_main = msg.t?.main ?? null;
      const room_humid = msg.rh ?? null;

      const fan = Array.isArray(msg.fan) ? msg.fan : undefined;
      const lamp = Array.isArray(msg.lamp) ? msg.lamp : undefined;
      const mode = msg.mode as $Enums.device_mode | undefined;

      const gpsFix = msg.gps?.fix ?? null;
      const gpsSat = msg.gps?.sat ?? null;
      const gpsLat = msg.gps?.lat ?? null;
      const gpsLon = msg.gps?.lon ?? null;

      // simpan telemetry + update state & last_seen_at dalam 1 transaksi
      await this.db.$transaction(async (tx) => {
         await tx.telemetry.create({
         data: {
            incubator_id: inc.id,
            ts,
            temp_ds: temp_ds ?? undefined,
            temp_dht: temp_dht ?? undefined,
            temp_main: temp_main ?? undefined,
            room_humid: room_humid ?? undefined,
            mode: (mode ?? inc.mode) as any,
            fan: fan ?? undefined,
            lamp: lamp ?? undefined,
            gpsFix: gpsFix ?? undefined,
            gpsSat: gpsSat ?? undefined,
            gpsLat: gpsLat ?? undefined,
            gpsLon: gpsLon ?? undefined,
            rev: msg.rev !== undefined ? BigInt(msg.rev) : undefined,
            fwVersion: msg.fw ?? undefined,
            raw: msg.raw ?? undefined,
         },
         });

         // snapshot state (gunakan service agar konsisten)
         await this.incubators.updateSnapshotFromTelemetry(inc.id, {
            temp_main: temp_main ?? undefined,
            room_humid: room_humid ?? undefined,
            mode: mode ?? undefined,
            fan: fan ?? undefined,
            lamp: lamp ?? undefined,
            gpsFix: gpsFix ?? undefined,
            gpsSat: gpsSat ?? undefined,
            gpsLat: gpsLat ?? undefined,
            gpsLon: gpsLon ?? undefined,
            fwVersion: msg.fw ?? undefined,
         });

         await tx.incubator.update({
            where: { id: inc.id },
            data: { last_seen_at: new Date() },
         });
      });

      // (opsional) log singkat
      this.logger.debug(`[ingest] ${code} @ ${ts.toISOString()} ok`);
   }
}
