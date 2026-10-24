import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Questions } from './question.entity';

@Entity(TABLES_NAME.ANSWERS)
export class Answers {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Questions, (question) => question.answers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: Questions;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;
}
