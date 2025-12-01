import { Module } from '@nestjs/common';
import { IncubatorsModule } from './modules/incubators/incubators.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { ConfigModule } from '@nestjs/config';
import { MqttModule } from './infra/mqtt/mqtt.module';
import { HealthController } from './common/health/health.controller';
import { PrismaModule } from './infra/prisma/prisma.module';

@Module({
  providers: [],
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    MqttModule,
    IncubatorsModule,
    TemplatesModule,
    TelemetryModule
  ],
})
export class AppModule {}
