import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Documents } from '../../document/entity/document.entity';
import { ActiveStatus } from '../../enums';
import { Faculties } from '../../faculty/entity/faculty.entity';
import { Roles } from '../../role/entity/role.entity';

@Entity(TABLES_NAME.USERS)
export class Users {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  avatar?: string | null;

  @Column({ type: 'varchar', length: 200 })
  fullName: string;

  @ManyToOne(() => Roles, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Roles;

  @ManyToOne(() => Faculties, { nullable: true })
  @JoinColumn({ name: 'faculty_id' })
  faculty?: Faculties | null;

  @Column({ type: 'varchar', length: 20, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Documents, (document) => document.uploader)
  documents: Documents[];
}
