import { Questions } from '../quiz/entity/question.entity';
import {
  QuestionView,
  QuizSummaryView,
  byPosition,
  toQuestionView,
} from '../quiz/quiz.view';
import { AttemptStatus } from '../enums';
import { Attempts } from './entity/attempt.entity';
import { UserAnswers } from './entity/user-answer.entity';

interface AttemptQuestionView extends QuestionView {
  selectedAnswerId: number | null;
  isCorrect?: boolean;
  explanation?: string | null;
}

export interface AttemptView {
  id: number;
  status: AttemptStatus;
  dateStarted: Date;
  dateSubmitted?: Date | null;
  startedAt: Date;
  now: Date;
  totalQuestion: number;
  totalAnswered: number;
  totalCorrect?: number | null;
  totalWrong?: number | null;
  totalSkipped?: number | null;
  score?: number | null;
  quiz: QuizSummaryView;
  questions: AttemptQuestionView[];
}

export interface AttemptHistoryView {
  id: number;
  status: AttemptStatus;
  dateStarted: Date;
  dateSubmitted?: Date | null;
  totalCorrect?: number | null;
  score?: number | null;
}

export const expiresAtOf = (attempt: Attempts, estimateMinute: number) =>
  new Date(attempt.dateStarted.getTime() + estimateMinute * 60_000);

export function toAttemptView(
  attempt: Attempts,
  quiz: QuizSummaryView,
  questions: Questions[],
  userAnswers: UserAnswers[],
): AttemptView {
  const submitted = attempt.status === AttemptStatus.SUBMITTED;
  const byQuestion = new Map(
    userAnswers.map((userAnswer) => [userAnswer.question.id, userAnswer]),
  );

  const questionViews = [...questions].sort(byPosition).map((question) => {
    const userAnswer = byQuestion.get(question.id);
    const view: AttemptQuestionView = {
      ...toQuestionView(question, submitted),
      selectedAnswerId: userAnswer?.answer?.id ?? null,
    };
    if (submitted) {
      view.isCorrect = userAnswer?.isCorrect ?? false;
      view.explanation = question.explanation;
    }
    return view;
  });

  const totalQuestion = questionViews.length;
  const totalAnswered = questionViews.filter(
    (question) => question.selectedAnswerId !== null,
  ).length;
  const totalCorrect = submitted
    ? questionViews.filter((question) => question.isCorrect).length
    : null;

  return {
    id: Number(attempt.id),
    status: attempt.status,
    dateStarted: attempt.dateStarted,
    dateSubmitted: attempt.dateSubmitted,
    startedAt: attempt.dateStarted,
    now: new Date(),
    totalQuestion,
    totalAnswered,
    totalCorrect: submitted ? attempt.totalCorrect : null,
    totalWrong: totalCorrect === null ? null : totalAnswered - totalCorrect,
    totalSkipped: submitted ? totalQuestion - totalAnswered : null,
    score: attempt.score,
    quiz,
    questions: questionViews,
  };
}

export function toAttemptHistory(attempt: Attempts): AttemptHistoryView {
  return {
    id: Number(attempt.id),
    status: attempt.status,
    dateStarted: attempt.dateStarted,
    dateSubmitted: attempt.dateSubmitted,
    totalCorrect: attempt.totalCorrect,
    score: attempt.score,
  };
}
