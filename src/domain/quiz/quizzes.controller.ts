import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { QuizContext } from './dto/quizzes.dto';
import { QuizAuthoringService } from './quiz-authoring.service';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
@ApiTags('Quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly quizAuthoringService: QuizAuthoringService,
  ) {}

  @Get('/')
  @ApiQuery({ name: 'subjectId', required: false, type: Number })
  list(@Query('subjectId') subjectId?: string) {
    const id = Number(subjectId);
    return this.quizzesService.list(
      Number.isInteger(id) && id > 0 ? id : undefined,
    );
  }

  @Get('/mine')
  mine(@CurrentUser() user: Users) {
    return this.quizzesService.mine(user.id);
  }

  @Post('/')
  @ApiBody({ type: QuizContext })
  create(@CurrentUser() user: Users, @Body() body: QuizContext) {
    return this.quizAuthoringService.create(user, body);
  }

  @Get('/:id')
  summary(@Param('id', ParseIntPipe) id: number) {
    return this.quizzesService.summary(id);
  }

  @Get('/:id/edit')
  editable(@CurrentUser() user: Users, @Param('id', ParseIntPipe) id: number) {
    return this.quizAuthoringService.getEditable(user, id);
  }

  @Put('/:id')
  @ApiBody({ type: QuizContext })
  update(
    @CurrentUser() user: Users,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: QuizContext,
  ) {
    return this.quizAuthoringService.update(user, id, body);
  }

  @Delete('/:id')
  remove(@CurrentUser() user: Users, @Param('id', ParseIntPipe) id: number) {
    return this.quizAuthoringService.remove(user, id);
  }
}
