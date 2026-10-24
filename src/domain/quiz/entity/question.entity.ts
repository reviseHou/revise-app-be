import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActiveStatus, QuestionType } from '../../enums';
import { Answers } from './answer.entity';
import { Quizzes } from './quiz.entity';

@Entity(TABLES_NAME.QUESTIONS)
export class Questions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Quizzes, (quiz) => quiz.questions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quizzes;

  @Column({ type: 'varchar', length: 1000 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: QuestionType.SINGLE_CHOICE })
  questionType: QuestionType;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  explanation?: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'varchar', length: 20, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Answers, (answer) => answer.question)
  answers: Answers[];
}
