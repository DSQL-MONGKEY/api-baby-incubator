import { IsArray, ArrayMinSize, ArrayMaxSize, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTemplateDto {
   @IsString()
   name!: string;

   @IsOptional()
   @IsString()
   description?: string;

   @IsArray() @ArrayMinSize(6) @ArrayMaxSize(6)
   fan!: number[];       // isi 0/1 persis 6 elemen

   @IsArray() @ArrayMinSize(2) @ArrayMaxSize(2)
   lamp!: number[];      // isi 0/1 persis 2 elemen

   @IsOptional() @IsBoolean()
   isArchived?: boolean;

   @IsOptional() @IsString()
   created_by?: string;
}
