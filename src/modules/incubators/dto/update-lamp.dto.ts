import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class UpdateLampDto {
   @IsArray()
   @ArrayMinSize(2) @ArrayMaxSize(2)
   @IsInt({ each: true }) @Min(0, { each: true }) @Max(1, { each: true })
   lamp!: number[];
}
