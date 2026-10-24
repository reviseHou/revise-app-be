import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActiveStatus } from '../../enums';
import { Majors } from '../../major/entity/major.entity';

@Entity(TABLES_NAME.FACULTIES)
export class Faculties {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToMany(() => Majors, (major) => major.faculty)
  majors: Majors[];
}
