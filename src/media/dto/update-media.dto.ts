import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaDto } from './create-media.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateMediaDto extends PartialType(CreateMediaDto) {
  @IsString()
  @IsOptional()
  fileName?: string;
}
