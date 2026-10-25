import {
  Body,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { QuizStatus } from 'src/domain/enums';
import { facultyScopeOf } from 'src/domain/faculty-scope';
import type { RejectDocumentForm } from 'src/domain/forms';
import { QuizBean } from 'src/domain/quiz/quiz.bean';
import { QUIZ_REVIEW_CRITERIA } from 'src/domain/quiz/quiz.criteria';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import type { CmsRequest } from '../util/cms.helper';
import { CmsPermission } from '../util/cms.permission';

const DETAIL = '/cms/quizzes/:id';

const ALL_STATUS = 'ALL';

@CmsController('cms/quizzes')
export class QuizController {
  constructor(private readonly quizBean: QuizBean) {}

  @Get()
  @CmsView(CmsPermission.READ_QUIZ, 'quiz/list')
  async showQuizList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('status') statusParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
    @Req() request: CmsRequest,
  ) {
    const scope = facultyScopeOf(request.user);
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const status =
      statusParam === ALL_STATUS
        ? undefined
        : (Object.values(QuizStatus).find((s) => s === statusParam) ??
          QuizStatus.PENDING);
    const { quizzes, total } = await this.quizBean.search(
      keyword,
      status,
      page,
      scope,
    );
    const countByStatus = await this.quizBean.countByStatus(scope);
    return {
      status: status ?? ALL_STATUS,
      keyword,
      quizzes,
      total,
      page,
      countByStatus,
      countAll: Object.values(countByStatus).reduce((a, b) => a + b, 0),
    };
  }

  @Get(':id')
  @CmsView(CmsPermission.READ_QUIZ, 'quiz/detail')
  async showQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const { quiz, questions } = await this.quizBean.findById(
      id,
      facultyScopeOf(request.user),
    );
    return { quiz, questions, criteria: QUIZ_REVIEW_CRITERIA };
  }

  @Post(':id/approve')
  @CmsAction(CmsPermission.REVIEW_QUIZ, { to: DETAIL })
  async approveQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const quiz = await this.quizBean.approve(id, request.user);
    return `Đã duyệt bài kiểm tra ${quiz.name}`;
  }

  @Post(':id/reject')
  @CmsAction(CmsPermission.REVIEW_QUIZ, { to: DETAIL })
  async rejectQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: RejectDocumentForm,
    @Req() request: CmsRequest,
  ) {
    const quiz = await this.quizBean.reject(id, request.user, form);
    return `Đã từ chối bài kiểm tra ${quiz.name}`;
  }

  @Post(':id/hide')
  @CmsAction(CmsPermission.REVIEW_QUIZ, { to: DETAIL })
  async hideQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const quiz = await this.quizBean.hide(id, request.user);
    return `Đã chuyển bài kiểm tra ${quiz.name} sang không hoạt động`;
  }

  @Post(':id/show')
  @CmsAction(CmsPermission.REVIEW_QUIZ, { to: DETAIL })
  async showHiddenQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const quiz = await this.quizBean.show(id, request.user);
    return `Đã kích hoạt lại bài kiểm tra ${quiz.name}`;
  }
}
