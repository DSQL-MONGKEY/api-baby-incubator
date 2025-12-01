import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class UpdateFanDto {
   @IsArray()
   @ArrayMinSize(6) @ArrayMaxSize(6)
   @IsInt({ each: true }) @Min(0, { each: true }) @Max(1, { each: true })
   fan!: number[];
}
