import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { AttemptsService } from './attempts.service';
import { SaveAnswersDto, SubmitAttemptDto } from './dto/attempts.dto';

@Controller()
@ApiTags('Quiz attempts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('/quizzes/:quizId/attempts')
  start(
    @CurrentUser() user: Users,
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return this.attemptsService.start(user, quizId);
  }

  @Get('/quizzes/:quizId/attempts/me')
  history(
    @CurrentUser() user: Users,
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return this.attemptsService.history(user, quizId);
  }

  @Get('/attempts/:id')
  get(@CurrentUser() user: Users, @Param('id', ParseIntPipe) id: number) {
    return this.attemptsService.get(user, id);
  }

  @Put('/attempts/:id/answers')
  @ApiBody({ type: SaveAnswersDto })
  saveAnswers(
    @CurrentUser() user: Users,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SaveAnswersDto,
  ) {
    return this.attemptsService.saveAnswers(user, id, body);
  }

  @Post('/attempts/:id/submit')
  @HttpCode(200)
  @ApiBody({ type: SubmitAttemptDto, required: false })
  submit(
    @CurrentUser() user: Users,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubmitAttemptDto,
  ) {
    return this.attemptsService.submit(user, id, body);
  }
}
