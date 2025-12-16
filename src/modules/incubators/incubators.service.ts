import { BadRequestException, GatewayTimeoutException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { $Enums, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MqttService } from 'src/infra/mqtt/mqtt.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class IncubatorsService {
  constructor(
    private readonly db: PrismaService,
    private readonly mqtt: MqttService,
    private readonly events: EventEmitter2
  ) {}

  private async publishAndWaitAck(
    code: string,
    type: 'control-mode' | 'fan' | 'lamp' | 'sensor-param',
    cmdTopic: string,
    payload: Record<string, any>,
    timeoutMs = 10000,
  ) {
    const correlationId = randomUUID();
    const ackTopic = `/psk/incubator/${code}/ack`;

    await this.mqtt.subscribe(ackTopic, 0);

    const waitAck = new Promise<any>((resolve, reject) => {
      const eventName = `mqtt.${ackTopic}`;
      const onMsg = (msg: { topic: string; data: string }) => {
        try {
          const ack = JSON.parse(msg.data);
          if (ack?.correlationId === correlationId && ack?.type === type) {
            this.events.off(eventName, onMsg);
            resolve(ack);
          }
        } catch {
          /* ignore invalid ack */
        }
      };
      this.events.on(eventName, onMsg);

      const t = setTimeout(() => {
        this.events.off(eventName, onMsg);
        reject(new GatewayTimeoutException('ACK timeout from device'));
      }, timeoutMs);
      // resolve/reject will clear by off() above; no need to hold ref t
    });

    await this.mqtt.publish(
      cmdTopic,
      { ...payload, correlationId },
      { qos: 1, retain: false },
    );

    const ack = await waitAck; // throws on timeout
    if (!ack?.ok) throw new BadRequestException(ack?.msg || 'Device NACK');
    return ack; // { ok, rev?, msg?, ... }
  }


  list() {
    return this.db.incubator.findMany({
      orderBy: { created_at: 'asc' },
      select: { id: true, code: true, name: true, status: true, mode: true, fwVersion: true, last_seen_at: true },
    });
  }

  async addNew(dto: {
    incubatorCode: string,
    name: string,
    status: $Enums.incubator_status,
    mode: $Enums.device_mode,
    locationLabel: string,
    fwVersion?: string,
  }) {
    if (dto.incubatorCode.length < 1) {
      throw new BadRequestException('Incubator code length must be more than 1 character');
    }

    const newInc = await this.db.incubator.create({
      data: {
        code: dto.incubatorCode,
        name: dto.name,
        status: dto.status,
        mode: dto.mode,
        location_label: dto.locationLabel,
        fwVersion: dto.fwVersion ?? 'iot-byin@1.0.0',
        last_seen_at:  new Date()
      }
    });

    await this.db.sensor_parameters.create({
      data: {
        incubator_id: newInc.id,
        temp_on_c: 36.7,
        rh_on_percent: 60,
        temp_off_c: 36.0,
        rh_off_percent: 50,
        ema_alpha: 0.2
      }
    });

    return newInc;
  }

  async getById(id: string) {
    const inc = await this.db.incubator.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incubator not found');
    return inc;
  }

  getState(id: string) {
    return this.db.state.findUnique({ where: { incubator_id: id } });
  }

  async setMode(id: string, mode: $Enums.device_mode) {
    // pastikan state ada
    await this.ensureStateRow(id);

    const inc = await this.db.incubator.findUnique({ where: { id }, select: { code: true } });

    if (!inc) throw new NotFoundException('incubator not found');

    const cmdTopic = `/psk/incubator/${inc.code}/control-mode`;

    await this.publishAndWaitAck(inc.code, 'control-mode', cmdTopic, { mode });

    // ACK OK -> update DB
    await this.db.incubator.update({
      where: { id },
      data: {
        mode,
      }
    });

    const state = await this.db.state.update({
      where: { incubator_id: id },
      data: { mode, 
        rev: {
          increment: BigInt(1)
        },
        updated_at: new Date()
      },
    });

    return {
      ...state,
      rev: Number(state.rev)
    }
  }

  async setFanManual(id: string, fan: number[]) {
    if (fan.length !== 6 || fan.some(v => v !== 0 && v !== 1))
    throw new BadRequestException('fan must be 6 elements of 0/1');

    const st = await this.db.state.findUnique({ where: { incubator_id: id } });
    if (!st) throw new NotFoundException('state not found');
    if (st.mode !== 'MANUAL') throw new BadRequestException('mode must be MANUAL');

    const inc = await this.db.incubator.findUnique({
      where: { id },
      select: { code: true }
    });

    if (!inc) throw new NotFoundException('incubator not found');

    const cmdTopic = `/psk/incubator/${inc.code}/fan`;
    await this.publishAndWaitAck(inc.code, 'fan', cmdTopic, { fan });

    return this.db.state.update({
      where: { incubator_id: id },
      data: { 
        fan, 
        rev: { increment: BigInt(1) }, 
        updated_at: new Date() 
      },
    });
  }

  async setLampManual(id: string, lamp: number[]) {
    if (lamp.length !== 2 || lamp.some(v => v !== 0 && v !== 1))
    throw new BadRequestException('lamp must be 2 elements of 0/1');

    const st = await this.db.state.findUnique({ where: { incubator_id: id } });
    if (!st) throw new NotFoundException('state not found');
    if (st.mode !== 'MANUAL') throw new BadRequestException('mode must be MANUAL');

    const inc = await this.db.incubator.findUnique({
      where: { id },
      select: { code: true },
    });
    if (!inc) throw new NotFoundException('incubator not found');

    const cmdTopic = `/psk/incubator/${inc.code}/lamp`;
    await this.publishAndWaitAck(inc.code, 'lamp', cmdTopic, { lamp });

    return this.db.state.update({
      where: { incubator_id: id },
      data: { 
        lamp, 
        rev: { increment: BigInt(1) }, 
        updated_at: new Date() 
      },
    });
  }

  getParams(id: string) {
    return this.db.sensor_parameters.findUnique({ where: { incubator_id: id } });
  }

  async upsertParams(id: string, dto: {
    temp_on_c: number; temp_off_c: number;
    rh_on_percent: number; rh_off_percent: number;
    ema_alpha: number; min_on_ms?: number; min_off_ms?: number; anti_chatter?: boolean;
  }) {
    const params = await this.db.sensor_parameters.upsert({
      where: { incubator_id: id },
      update: { ...dto },
      create: { incubator_id: id, ...dto },
    });

    const inc = await this.db.incubator.findUnique({ where: { id }, select: { code: true } });
    if (!inc) throw new NotFoundException('incubator not found');

    const cmdTopic = `/psk/incubator/${inc.code}/sensor-param`;
    await this.publishAndWaitAck(inc.code, 'sensor-param', cmdTopic, {
      v: 1,
      temp_on_c: dto.temp_on_c,
      temp_off_c: dto.temp_off_c,
      rh_on_percent: dto.rh_on_percent,
      rh_off_percent: dto.rh_off_percent,
      ema_alpha: dto.ema_alpha,
      min_on_ms: dto.min_on_ms ?? null,
      min_off_ms: dto.min_off_ms ?? null,
      anti_chatter: dto.anti_chatter ?? null,
    });

    return params;
  }

  // dipakai ingestion module nanti
  async updateSnapshotFromTelemetry(id: string, p: {
    temp_main?: number | null; room_humid?: number | null;
    mode?: $Enums.device_mode; fan?: number[]; lamp?: number[];
    gpsFix?: boolean | null; gpsSat?: number | null; gpsLat?: number | null; gpsLon?: number | null;
    fwVersion?: string | null;
  }) {
    await this.ensureStateRow(id);
    const dec = (v?: number | null) =>
      v === undefined || v === null ? undefined : new Prisma.Decimal(v.toString());

    return this.db.state.update({
      where: { incubator_id: id },
      data: {
        current_temp_c: p.temp_main ?? undefined,
        current_rh_percent: p.room_humid ?? undefined,
        mode: p.mode,
        fan: p.fan,
        lamp: p.lamp,
        gpsFix: p.gpsFix,
        gpsSat: p.gpsSat, 
        gpsLat: p.gpsLat, 
        gpsLon: p.gpsLon,
        fwVersion: p.fwVersion ?? undefined,
        updated_at: new Date(),
      },
    });
  }

  private async ensureStateRow(incubatorId: string) {
    const st = await this.db.state.findUnique({ where: { incubator_id: incubatorId } });
    if (!st) {
      await this.db.state.upsert({
        where: { incubator_id: incubatorId },
        update: {},
        create: {
          incubator_id: incubatorId,
          mode: 'AUTO',
          fan: [0,0,0,0,0,0],
          lamp: [1,1],
          rev: BigInt(0),
        },
      });
    }
  }
}
