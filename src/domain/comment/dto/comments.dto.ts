import { ApiProperty } from '@nestjs/swagger';
import { SourceType } from '../../enums';

export class CreateCommentDto {
  @ApiProperty({ enum: SourceType })
  sourceType: SourceType;

  @ApiProperty()
  sourceId: number;

  @ApiProperty({ maxLength: 1000 })
  content: string;

  @ApiProperty({ required: false, description: 'Bình luận cha khi trả lời' })
  parentId?: number;

  @ApiProperty({ required: false, description: 'Người được nhắc tới' })
  replyToUserId?: number;
}

export class UpdateCommentDto {
  @ApiProperty({ maxLength: 1000 })
  content: string;
}
