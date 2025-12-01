import { IsEnum } from 'class-validator';

export enum DeviceMode { AUTO = 'AUTO', MANUAL = 'MANUAL' }

export class UpdateModeDto {
   @IsEnum(DeviceMode)
   mode!: DeviceMode;
}
