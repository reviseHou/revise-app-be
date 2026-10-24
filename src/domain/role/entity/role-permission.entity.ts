import { TABLES_NAME } from 'src/constants';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Permissions } from '../../permission/entity/permission.entity';
import { Roles } from './role.entity';

@Entity(TABLES_NAME.ROLE_PERMISSIONS)
@Unique(['role', 'permission'])
export class RolePermissions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Roles, (role) => role.rolePermissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Roles;

  @ManyToOne(() => Permissions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permissions;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;
}
