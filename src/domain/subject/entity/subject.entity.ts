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
import { Documents } from '../../document/entity/document.entity';
import { ActiveStatus } from '../../enums';
import { Majors } from '../../major/entity/major.entity';

@Entity(TABLES_NAME.SUBJECTS)
export class Subjects {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Majors, (major) => major.subjects, { nullable: false })
  @JoinColumn({ name: 'major_id' })
  major: Majors;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'smallint', nullable: true })
  credit?: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 20, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Documents, (document) => document.subject)
  documents: Documents[];
}
