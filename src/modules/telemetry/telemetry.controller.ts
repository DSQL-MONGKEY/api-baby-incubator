import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('incubators/:incubatorId/telemetry')
export class TelemetryController {
  constructor(private readonly svc: TelemetryService) {}

  @Get('latest')
  latest(@Param('incubatorId', new ParseUUIDPipe()) incubatorId: string) {
    return this.svc.latest(incubatorId);
  }

  @Get()
  list(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.svc.listRaw(incubatorId, {
      from, to,
      limit: limit ? parseInt(limit, 10) : undefined,
      order: order ?? 'desc',
    });
  }

  @Get('series')
  series(
    @Param('incubatorId', new ParseUUIDPipe()) incubatorId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('bucket') bucket?: string, // detik (default 60)
  ) {
    return this.svc.series(incubatorId, { from, to, bucket });
  }
}
