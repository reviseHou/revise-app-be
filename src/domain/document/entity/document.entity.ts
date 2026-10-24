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
import { DocumentStatus } from '../../enums';
import { Subjects } from '../../subject/entity/subject.entity';
import { Users } from '../../user/entity/user.entity';

@Entity(TABLES_NAME.DOCUMENTS)
export class Documents {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Subjects, (subject) => subject.documents, {
    nullable: false,
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subjects;

  @ManyToOne(() => Users, (user) => user.documents, { nullable: false })
  @JoinColumn({ name: 'uploader_id' })
  uploader: Users;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description?: string | null;

  @Column({ type: 'smallint', nullable: true })
  year?: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mediaType?: string | null;

  @Column({ type: 'varchar', length: 20, default: DocumentStatus.PENDING })
  status: DocumentStatus;

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
}
