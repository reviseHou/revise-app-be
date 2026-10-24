import { QuizStatus } from '../enums';
import { Answers } from './entity/answer.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';

interface SubjectRef {
  id: number;
  name: string;
  code: string;
}

export interface QuizSummaryView {
  id: number;
  name: string;
  description?: string | null;
  estimateMinute: number;
  totalQuestion: number;
  attemptCount: number;
  subject: SubjectRef;
  dateCreated: Date;
}

export interface MyQuizView extends QuizSummaryView {
  status: QuizStatus;
  rejectReason?: string | null;
  dateModified: Date;
}

interface AnswerView {
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

export const byPosition = <T extends { position: number; id: number }>(
  a: T,
  b: T,
) => a.position - b.position || a.id - b.id;

function toSubjectRef(quiz: Quizzes): SubjectRef {
  return {
    id: quiz.subject.id,
    name: quiz.subject.name,
    code: quiz.subject.code,
  };
}

export function toQuizSummary(
  quiz: Quizzes,
  attemptCount: number,
): QuizSummaryView {
  return {
    id: quiz.id,
    name: quiz.name,
    description: quiz.description,
    estimateMinute: quiz.estimateMinute,
    totalQuestion: quiz.totalQuestion,
    attemptCount,
    subject: toSubjectRef(quiz),
    dateCreated: quiz.dateCreated,
  };
}

function toAnswerView(answer: Answers, revealCorrect: boolean) {
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
    answers: [...question.answers]
      .sort(byPosition)
      .map((answer) => toAnswerView(answer, revealCorrect)),
  };
}
