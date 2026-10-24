import { ApiProperty } from '@nestjs/swagger';
import { SourceType } from '../../enums';

export class SavedItemDto {
  @ApiProperty({ enum: SourceType })
  sourceType: SourceType;

  @ApiProperty()
  sourceId: number;
}
