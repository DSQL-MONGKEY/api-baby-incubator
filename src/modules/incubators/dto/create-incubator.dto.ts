import { $Enums } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

export class CreateIncubatorDto {
   @IsString() incubatorCode: string;
   @IsString() name: string;
   @IsString() status: $Enums.incubator_status;
   @IsString() mode: $Enums.device_mode;
   @IsString() locationLabel: string;
   @IsString() @IsOptional()
   fwVersion: string;

}
