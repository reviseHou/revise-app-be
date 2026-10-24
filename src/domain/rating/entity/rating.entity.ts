import { TABLES_NAME } from 'src/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { SourceType } from '../../enums';
import { Users } from '../../user/entity/user.entity';

@Entity(TABLES_NAME.RATINGS)
@Unique(['sourceType', 'sourceId', 'user'])
export class Ratings {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 20 })
  sourceType: SourceType;

  @Column({ type: 'bigint' })
  sourceId: string;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ type: 'smallint' })
  star: number;

  @CreateDateColumn()
  dateCreated: Date;

  @UpdateDateColumn()
  dateModified: Date;
}
