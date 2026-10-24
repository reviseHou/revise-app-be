import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidationError } from 'class-validator';
import { SourceType } from './enums';

export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

const firstMessage = (errors: ValidationError[]): string =>
  errors
    .map(
      (error) =>
        Object.values(error.constraints ?? {})[0] ??
        firstMessage(error.children ?? []),
    )
    .find(Boolean) ?? 'Dữ liệu không hợp lệ';

export const toValidationException = (errors: ValidationError[]) =>
  new BadRequestException(firstMessage(errors));

export class SourceKeyDto {
  @ApiProperty({ enum: SourceType })
  @IsEnum(SourceType, { message: 'sourceType phải là DOCUMENT hoặc QUIZ' })
  sourceType: SourceType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'sourceId không hợp lệ' })
  @Min(1, { message: 'sourceId không hợp lệ' })
  sourceId: number;
}
