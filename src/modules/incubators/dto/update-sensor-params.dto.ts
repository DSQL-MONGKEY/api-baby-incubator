import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSensorParamsDto {
   @IsNumber() temp_on_c!: number;
   @IsNumber() temp_off_c!: number;
   @IsNumber() rh_on_percent!: number;
   @IsNumber() rh_off_percent!: number;
   @IsNumber() ema_alpha!: number;

   @IsOptional() @IsInt() @Min(0) min_on_ms?: number;
   @IsOptional() @IsInt() @Min(0) min_off_ms?: number;
   @IsOptional() @IsBoolean() anti_chatter?: boolean;
}
