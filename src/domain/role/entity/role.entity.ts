import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../user/entity/user.entity';
import { RolePermissions } from './role-permission.entity';

@Entity(TABLES_NAME.ROLES)
export class Roles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;

  @OneToMany(() => Users, (user) => user.role)
  users: Users[];

  @OneToMany(() => RolePermissions, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermissions[];
}
