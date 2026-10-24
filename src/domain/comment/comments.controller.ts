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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { SourceKeyDto } from '../validation';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Controller('comments')
@ApiTags('Comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('/')
  list(@Query() query: SourceKeyDto) {
    return this.commentsService.list(query);
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
