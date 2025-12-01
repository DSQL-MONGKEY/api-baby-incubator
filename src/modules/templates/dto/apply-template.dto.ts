import { IsOptional, IsString, IsIn } from 'class-validator';

export class ApplyTemplateDto {
   /** SET_MANUAL: paksa ke MANUAL sebelum apply; KEEP: biarkan mode saat ini */
   @IsOptional()
   @IsIn(['SET_MANUAL', 'KEEP'])
   syncMode?: 'SET_MANUAL' | 'KEEP' = 'SET_MANUAL';

   /** Opsional: siapa yang trigger (user id/email) */
   @IsOptional() @IsString()
   requested_by?: string;
}
