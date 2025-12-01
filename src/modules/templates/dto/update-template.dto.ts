import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-template.dto';
import { IsOptional, IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean } from 'class-validator';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
   @IsOptional() @IsString()
   name?: string;

   @IsOptional() @IsString()
   description?: string;

   @IsOptional() @IsArray() @ArrayMinSize(6) @ArrayMaxSize(6)
   fan?: number[];

   @IsOptional() @IsArray() @ArrayMinSize(2) @ArrayMaxSize(2)
   lamp?: number[];

   @IsOptional() @IsBoolean()
   isArchived?: boolean;
}
