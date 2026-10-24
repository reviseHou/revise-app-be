import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { SourceType } from '../enums';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Controller('comments')
@ApiTags('Comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('/')
  @ApiQuery({ name: 'sourceType', enum: SourceType })
  @ApiQuery({ name: 'sourceId', type: Number })
  list(
    @Query('sourceType') sourceType: string,
    @Query('sourceId') sourceId: string,
  ) {
    return this.commentsService.list(sourceType, sourceId);
  }

  @Post('/')
  create(@CurrentUser() user: Users, @Body() body: CreateCommentDto) {
    return this.commentsService.create(user, body);
  }

  @Patch('/:id')
  update(
    @CurrentUser() user: Users,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCommentDto,
  ) {
    return this.commentsService.update(user, id, body);
  }

  @Delete('/:id')
  remove(@CurrentUser() user: Users, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(user, id);
  }
}
