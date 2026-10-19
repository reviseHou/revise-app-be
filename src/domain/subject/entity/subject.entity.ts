import { ApiProperty } from '@nestjs/swagger';
import { Majors } from '../../major/entity/major.entity';
import { ActiveStatus } from '../../enums';
import { TABLES_NAME } from 'src/constants';
import { Documents } from '../../document/entity/document.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity(TABLES_NAME.SUBJECTS)
export class Subjects {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', unique: true, nullable: true })
  code?: string | null;

  @ApiProperty()
  @Column({ type: 'varchar', default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @ApiProperty({ required: false })
  @ManyToOne(() => Majors, (major) => major.subjects, { nullable: true })
  major?: Majors | null;

  @OneToMany(() => Documents, (document) => document.subject)
  documents: Documents[];

  @CreateDateColumn()
  createdAt: Date;
}
