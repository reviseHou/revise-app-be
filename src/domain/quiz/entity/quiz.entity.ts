import { ApiProperty } from '@nestjs/swagger';
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
import { QuizStatus } from '../../enums';
import { Subjects } from '../../subject/entity/subject.entity';
import { Users } from '../../user/entity/user.entity';
import { Questions } from './question.entity';

@Entity(TABLES_NAME.QUIZZES)
export class Quizzes {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @ApiProperty()
  @Column({ type: 'int' })
  durationMinutes: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: QuizStatus.PENDING })
  status: QuizStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 1000, nullable: true })
  rejectReason?: string | null;

  @ManyToOne(() => Users, { nullable: true })
  reviewedBy?: Users | null;

  @Column({ type: 'timestamp', nullable: true })
  dateReviewed?: Date | null;

  @ManyToOne(() => Subjects, { nullable: false })
  subject: Subjects;

  @ManyToOne(() => Users, { nullable: true })
  createdBy?: Users | null;

  @OneToMany(() => Questions, (question) => question.quiz)
  questions: Questions[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
