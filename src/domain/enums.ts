export enum ActiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum QuizStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  // Deleted by its author: kept only for attempt history, cannot be restored.
  DELETED = 'DELETED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

export enum SourceType {
  DOCUMENT = 'DOCUMENT',
  QUIZ = 'QUIZ',
}

export enum DocumentCategory {
  SLIDE = 'SLIDE',
  OUTLINE = 'OUTLINE',
  TEXTBOOK = 'TEXTBOOK',
  EXERCISE = 'EXERCISE',
  EXAM = 'EXAM',
  OTHER = 'OTHER',
}

export enum DocumentSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  VIEWS = 'views',
}
