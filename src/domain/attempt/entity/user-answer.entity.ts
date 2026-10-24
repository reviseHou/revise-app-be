import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
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
  attempt: Attempts;

  @ManyToOne(() => Questions, { nullable: false, onDelete: 'CASCADE' })
  question: Questions;

  @ManyToOne(() => Answers, { nullable: true, onDelete: 'SET NULL' })
  answer?: Answers | null;

  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean | null;

  @Column({ type: 'timestamp', nullable: true })
  dateAnswered?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
