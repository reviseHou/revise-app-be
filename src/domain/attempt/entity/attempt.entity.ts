import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttemptStatus } from '../../enums';
import { Quizzes } from '../../quiz/entity/quiz.entity';
import { Users } from '../../user/entity/user.entity';
import { UserAnswers } from './user-answer.entity';

const decimal = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? null : Number(value)),
};

@Entity(TABLES_NAME.ATTEMPTS)
export class Attempts {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Quizzes, { nullable: false, onDelete: 'CASCADE' })
  quiz: Quizzes;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  user: Users;

  @Column({ type: 'varchar', length: 20, default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus;

  @Column({ type: 'timestamp' })
  dateStarted: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateSubmitted?: Date | null;

  @Column({ type: 'int', nullable: true })
  totalCorrect?: number | null;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 2,
    nullable: true,
    transformer: decimal,
  })
  score?: number | null;

  @OneToMany(() => UserAnswers, (userAnswer) => userAnswer.attempt)
  userAnswers: UserAnswers[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
