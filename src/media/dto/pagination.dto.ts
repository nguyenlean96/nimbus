import { IsOptional, Min, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}