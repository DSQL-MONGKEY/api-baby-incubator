import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IncubatorsModule } from './modules/incubators/incubators.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [IncubatorsModule, TemplatesModule, TelemetryModule],
})
export class AppModule {}
