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
import { ActiveStatus } from '../../enums';
import { Faculties } from '../../faculty/entity/faculty.entity';
import { Subjects } from '../../subject/entity/subject.entity';

@Entity(TABLES_NAME.MAJORS)
export class Majors {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Faculties, (faculty) => faculty.majors, { nullable: false })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculties;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 20, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Subjects, (subject) => subject.major)
  subjects: Subjects[];
}
