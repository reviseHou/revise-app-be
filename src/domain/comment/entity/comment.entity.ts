import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActiveStatus, SourceType } from '../../enums';
import { Users } from '../../user/entity/user.entity';

@Entity(TABLES_NAME.COMMENTS)
@Index(['sourceType', 'sourceId'])
export class Comments {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 20 })
  sourceType: SourceType;

  @Column({ type: 'bigint' })
  sourceId: string;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  user: Users;

  @ManyToOne(() => Comments, { nullable: true, onDelete: 'CASCADE' })
  parent?: Comments | null;

  @ManyToOne(() => Users, { nullable: true, onDelete: 'SET NULL' })
  replyToUser?: Users | null;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @Column({ type: 'varchar', length: 20, default: ActiveStatus.ACTIVE })
  status: ActiveStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
