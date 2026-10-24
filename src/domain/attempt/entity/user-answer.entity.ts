import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Answers } from '../../quiz/entity/answer.entity';
import { Questions } from '../../quiz/entity/question.entity';
import { Attempts } from './attempt.entity';

@Entity(TABLES_NAME.USER_ANSWERS)
@Unique(['attempt', 'question'])
export class UserAnswers {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Attempts, (attempt) => attempt.userAnswers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: Attempts;

  @ManyToOne(() => Questions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Questions;

  @ManyToOne(() => Answers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'answer_id' })
  answer?: Answers | null;

  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean | null;

  @Column({ type: 'timestamp', nullable: true })
  dateAnswered?: Date | null;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;
}
