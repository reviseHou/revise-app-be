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
import { QuizStatus } from '../../enums';
import { Subjects } from '../../subject/entity/subject.entity';
import { Users } from '../../user/entity/user.entity';
import { Questions } from './question.entity';

@Entity(TABLES_NAME.QUIZZES)
export class Quizzes {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subjects, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: Subjects;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'int' })
  estimateMinute: number;

  @Column({ type: 'int', default: 0 })
  totalQuestion: number;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: Users | null;

  @Column({ type: 'varchar', length: 20, default: QuizStatus.PENDING })
  status: QuizStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  rejectReason?: string | null;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy?: Users | null;

  @Column({ type: 'timestamp', nullable: true })
  dateReviewed?: Date | null;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Questions, (question) => question.quiz)
  questions: Questions[];
}
