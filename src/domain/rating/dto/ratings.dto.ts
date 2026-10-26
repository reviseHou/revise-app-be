import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { SourceKeyDto } from '../../validation';

export class RateDto extends SourceKeyDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt({ message: 'Số sao phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Số sao phải là số nguyên từ 1 đến 5' })
  @Max(5, { message: 'Số sao phải là số nguyên từ 1 đến 5' })
  star: number;
}
