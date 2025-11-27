import { PartialType } from '@nestjs/mapped-types';
import { CreateIncubatorDto } from './create-incubator.dto';

export class UpdateIncubatorDto extends PartialType(CreateIncubatorDto) {}
