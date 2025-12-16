import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IncubatorsService } from '../incubators/incubators.service';
import { $Enums } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MqttService } from 'src/infra/mqtt/mqtt.service';

function assertBinaryArray(arr: number[], len: number, label: string) {
  if (!Array.isArray(arr) || arr.length !== len) {
    throw new BadRequestException(`${label} must be an array of length ${len}`);
  }
  for (const v of arr) {
    if (!(v === 0 || v === 1)) {
      throw new BadRequestException(`${label} values must be 0 or 1`);
    }
  }
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly db: PrismaService,
    private readonly incubators: IncubatorsService,
    private readonly mqtt: MqttService,
  ) {}

  async list(incubatorId: string, includeArchived = false) {
    await this.ensureIncubator(incubatorId);
    return this.db.templates.findMany({
      where: { incubator_id: incubatorId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, description: true, fan: true, lamp: true, isArchived: true, created_at: true, updated_at: true },
    });
  }

  async get(incubatorId: string, templateId: string) {
    await this.ensureIncubator(incubatorId);
    const t = await this.db.templates.findFirst({ where: { id: templateId, incubator_id: incubatorId } });
    if (!t) throw new NotFoundException('template not found');
    return t;
  }

  async create(incubatorId: string, dto: CreateTemplateDto) {
    await this.ensureIncubator(incubatorId);
    assertBinaryArray(dto.fan, 6, 'fan');
    assertBinaryArray(dto.lamp, 2, 'lamp');

    try {
      return await this.db.templates.create({
        data: {
          incubator_id: incubatorId,
          name: dto.name.trim(),
          description: dto.description,
          fan: dto.fan,
          lamp: dto.lamp,
          isArchived: !!dto.isArchived,
          created_by: dto.created_by,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // unique([incubator_id, name])
        throw new BadRequestException('template name already exists in this incubator');
      }
      throw e;
    }
  }

  async update(incubatorId: string, templateId: string, dto: UpdateTemplateDto) {
    await this.ensureIncubator(incubatorId);
    const existing = await this.get(incubatorId, templateId);

    if (dto.fan)  assertBinaryArray(dto.fan, 6, 'fan');
    if (dto.lamp) assertBinaryArray(dto.lamp, 2, 'lamp');

    try {
      return await this.db.templates.update({
        where: { id: existing.id },
        data: {
          name: dto.name?.trim(),
          description: dto.description,
          fan: dto.fan,
          lamp: dto.lamp,
          isArchived: dto.isArchived,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('template name already exists in this incubator');
      }
      throw e;
    }
  }

  async delete(incubatorId: string, templateId: string) {
    await this.ensureIncubator(incubatorId);
    const existing = await this.get(incubatorId, templateId);
    return this.db.templates.delete({
      where: { id: existing.id },
    });
  }

  /**
   * Apply template:
   * - (opsional) set mode ke MANUAL
   * - update state.fan[] dan state.lamp[] di DB (rev++)
   * - publish MQTT ke device (control-mode, fan[], lamp)
   * - catat template_activation
   */
  async apply(incubatorId: string, templateId: string, dto: ApplyTemplateDto) {
    const inc = await this.ensureIncubator(incubatorId);
    const tpl = await this.get(incubatorId, templateId);

    const corr = randomUUID();
    const topicBase = `/psk/incubator/${inc.code}`;

    // 1) Mode sinkronisasi
    if ((dto.syncMode ?? 'SET_MANUAL') === 'SET_MANUAL') {
      await this.incubators.setMode(incubatorId, $Enums.device_mode.MANUAL);
      await this.mqtt.publish(`${topicBase}/control-mode`, { mode: 'MANUAL' }, { qos: 1, retain: true });
    }

    // 2) Update DB snapshot (menjaga konsistensi API state)
    await this.incubators.setFanManual(incubatorId, tpl.fan);
    // lamp device adalah grup (CH7+CH8), decide ON jika salah satu =1
    const lampOn = (tpl.lamp?.[0] ?? 0) || (tpl.lamp?.[1] ?? 0) ? 1 : 0;
    await this.incubators.setLampManual(incubatorId, [lampOn, lampOn]);

    // 3) Publish MQTT ke device (retained supaya app/device yang telat subscribe tetap dapat)
    await this.mqtt.publish(`${topicBase}/fan`,  { fan: tpl.fan, mode: 'MANUAL', corr: corr }, { qos: 1, retain: true });
    await this.mqtt.publish(`${topicBase}/lamp`, { lamp: lampOn,     corr: corr },             { qos: 1, retain: true });

    // 4) Catat activation
    await this.db.template_activation.create({
      data: {
        incubator_id: incubatorId,
        template_id: tpl.id,
        requested_by: dto.requested_by,
        correlation_id: corr,
        result: 'APPLIED',
        applied_mode: 'MANUAL',
        applied_fan: tpl.fan,
        applied_lamp: [lampOn, lampOn],
      },
    });

    return { ok: true, correlation_id: corr };
  }

  private async ensureIncubator(id: string) {
    const inc = await this.db.incubator.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException('incubator not found');
    return inc;
  }
}
