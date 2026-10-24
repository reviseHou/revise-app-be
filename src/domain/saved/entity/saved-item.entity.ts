import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SourceType } from '../../enums';
import { Users } from '../../user/entity/user.entity';

@Entity(TABLES_NAME.SAVED_ITEMS)
@Unique(['user', 'sourceType', 'sourceId'])
export class SavedItems {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ type: 'varchar', length: 20 })
  sourceType: SourceType;

  @Column({ type: 'bigint' })
  sourceId: string;

  @CreateDateColumn()
  dateCreated: Date;
}
