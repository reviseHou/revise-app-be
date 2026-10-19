import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TABLES_NAME } from 'src/constants';
import { ActiveStatus } from '../../enums';
import { Subjects } from '../../subject/entity/subject.entity';
import { Faculties } from '../../faculty/entity/faculty.entity';

@Entity(TABLES_NAME.MAJORS)
export class Majors {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Faculties, (faculty) => faculty.majors, { nullable: false })
  faculty: Faculties;

  @OneToMany(() => Subjects, (subject) => subject.major)
  subjects: Subjects[];
}
