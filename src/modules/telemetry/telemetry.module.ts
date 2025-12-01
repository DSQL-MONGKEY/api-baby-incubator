import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryIngestService } from './telemetry.ingest.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { IncubatorsModule } from '../incubators/incubators.module';

@Module({
  imports: [IncubatorsModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryIngestService],
})
export class TelemetryModule {}
