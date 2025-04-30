import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsOptional()
  collection?: string;
}