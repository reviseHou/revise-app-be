import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TABLES_NAME } from 'src/constants';
import { ActiveStatus } from '../../enums';
import { Majors } from '../../major/entity/major.entity';

@Entity(TABLES_NAME.FACULTIES)
export class Faculties {
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

  @OneToMany(() => Majors, (major) => major.faculty)
  majors: Majors[];
}
