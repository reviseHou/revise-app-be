import { TABLES_NAME } from 'src/constants';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../user/entity/user.entity';
import { Documents } from './document.entity';

@Entity(TABLES_NAME.DOCUMENT_VIEWS)
export class DocumentViews {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Documents, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Documents;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @CreateDateColumn()
  dateCreated: Date;
}
