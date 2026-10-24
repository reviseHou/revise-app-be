import { QuizStatus } from '../enums';
import { Answers } from './entity/answer.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';

export interface SubjectRef {
  id: number;
  title: string;
  code?: string | null;
}

export interface QuizSummaryView {
  id: number;
  title: string;
  description?: string | null;
  durationMinutes: number;
  questionCount: number;
  attemptCount: number;
  subject: SubjectRef;
  createdAt: Date;
}

export interface MyQuizView extends QuizSummaryView {
  status: QuizStatus;
  rejectReason?: string | null;
  updateAt: Date;
}

export interface AnswerView {
  id: number;
  title: string;
  position: number;
  isCorrect?: boolean;
}

export interface QuestionView {
  id: number;
  title: string;
  position: number;
  answers: AnswerView[];
}

export type QuizCounts = { questionCount: number; attemptCount: number };

export const byPosition = <T extends { position: number; id: number }>(
  a: T,
  b: T,
) => a.position - b.position || a.id - b.id;

export function toSubjectRef(quiz: Quizzes): SubjectRef {
  return {
    id: quiz.subject.id,
    title: quiz.subject.title,
    code: quiz.subject.code,
  };
}

export function toQuizSummary(
  quiz: Quizzes,
  counts: QuizCounts,
): QuizSummaryView {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    durationMinutes: quiz.durationMinutes,
    questionCount: counts.questionCount,
    attemptCount: counts.attemptCount,
    subject: toSubjectRef(quiz),
    createdAt: quiz.createdAt,
  };
}

export function toAnswerView(answer: Answers, revealCorrect: boolean) {
  const view: AnswerView = {
    id: answer.id,
    title: answer.title,
    position: answer.position,
  };
  if (revealCorrect) view.isCorrect = answer.isCorrect;
  return view;
}

export function toQuestionView(
  question: Questions,
  revealCorrect: boolean,
): QuestionView {
  return {
    id: question.id,
    title: question.title,
    position: question.position,
    answers: [...(question.answers ?? [])]
      .sort(byPosition)
      .map((answer) => toAnswerView(answer, revealCorrect)),
  };
}
