import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  modelType: string;

  @IsNumber()
  modelId: number;

  @IsString()
  @IsOptional()
  collection?: string;
}