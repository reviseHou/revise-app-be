import { TABLES_NAME } from 'src/constants';
import { Permissions } from '../../permission/entity/permission.entity';
import { Users } from '../../user/entity/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity(TABLES_NAME.ROLES)
export class Roles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Users, (user) => user.role)
  users: Users[];

  @ManyToMany(() => Permissions)
  @JoinTable()
  permissions: Permissions[];
}
