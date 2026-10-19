import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../../enums';
import { TABLES_NAME } from 'src/constants';
import { Subjects } from '../../subject/entity/subject.entity';
import { Users } from '../../user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity(TABLES_NAME.DOCUMENTS)
export class Documents {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column()
  @ApiProperty()
  title: string;

  @Column({ nullable: true })
  @ApiProperty()
  description: string;

  @Column()
  @ApiProperty()
  content: string;

  @Column({ type: 'varchar', default: DocumentStatus.PENDING })
  @ApiProperty()
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @ApiProperty({ required: false })
  rejectReason?: string | null;

  @ManyToOne(() => Users, { nullable: true })
  reviewedBy?: Users | null;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  dateReviewed?: Date | null;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  fileUrl?: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ required: false })
  attachments?: any;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @CreateDateColumn()
  @ApiProperty()
  updateAt: Date;

  @ApiProperty()
  @ManyToOne(() => Subjects, (subject) => subject.documents)
  subject: Subjects;

  @ApiProperty()
  @ManyToOne(() => Users, (user) => user.documents)
  author: Users;
}
