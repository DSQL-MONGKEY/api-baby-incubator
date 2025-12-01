import { Module } from '@nestjs/common';
import { IncubatorsService } from './incubators.service';
import { IncubatorsController } from './incubators.controller';

@Module({
  controllers: [IncubatorsController],
  providers: [IncubatorsService],
  exports: [IncubatorsService]
})
export class IncubatorsModule {}

