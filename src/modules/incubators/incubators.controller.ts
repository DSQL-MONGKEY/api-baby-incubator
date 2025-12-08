import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { IncubatorsService } from './incubators.service';
import { UpdateModeDto } from './dto/update-mode.dto';
import { UpdateFanDto } from './dto/update-fan.dto';
import { UpdateLampDto } from './dto/update-lamp.dto';
import { UpdateSensorParamsDto } from './dto/update-sensor-params.dto';
import { IncubatorId } from 'src/common/decorators/incubator-id.decorator';
import { CreateIncubatorDto } from './dto/create-incubator.dto';

@Controller('incubators')
export class IncubatorsController {
  constructor(private readonly svc: IncubatorsService) {}

  // list & detail
  @Get()
  list() { return this.svc.list(); }

  @Post()
  addNewIncubator(@Body() dto: CreateIncubatorDto) {
    return this.svc.addNew(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) { return this.svc.getById(id); }

  // state
  @Get(':id/state')
  state(@Param('id') id: string) { return this.svc.getState(id); }

  // control
  @Patch(':id/mode')
  setMode(@Param('id') id: string, @Body() dto: UpdateModeDto) {
    return this.svc.setMode(id, dto.mode as any);
  }

  @Patch(':id/fan')
  setFan(@IncubatorId() id: string, @Body() dto: UpdateFanDto) {
    return this.svc.setFanManual(id, dto.fan);
  }

  @Patch(':id/lamp')
  setLamp(@IncubatorId() id: string, @Body() dto: UpdateLampDto) {
    return this.svc.setLampManual(id, dto.lamp);
  }

  // params
  @Get(':id/params')
  getParams(@Param('id') id: string) { return this.svc.getParams(id); }

  @Put(':id/params')
  putParams(@Param('id') id: string, @Body() dto: UpdateSensorParamsDto) {
    return this.svc.upsertParams(id, dto);
  }
}
