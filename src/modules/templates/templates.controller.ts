import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';

@Controller('incubators/:incubatorId/templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const include = includeArchived === 'true';
    return this.svc.list(incubatorId, include);
  }

  @Get(':templateId')
  get(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ) {
    return this.svc.get(incubatorId, templateId);
  }

  @Post()
  create(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.svc.create(incubatorId, dto);
  }

  @Patch(':templateId')
  update(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.svc.update(incubatorId, templateId, dto);
  }

  @Delete(':templateId')
  archive(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ) {
    return this.svc.archive(incubatorId, templateId);
  }

  @Post(':templateId/apply')
  apply(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.svc.apply(incubatorId, templateId, dto);
  }
}
