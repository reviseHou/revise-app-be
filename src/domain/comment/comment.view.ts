import { ActiveStatus } from '../enums';
import { Users } from '../user/entity/user.entity';
import { Comments } from './entity/comment.entity';

export interface CommentUserView {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

export interface CommentView {
  id: number;
  parentId: number | null;
  content: string | null;
  deleted: boolean;
  createdAt: Date;
  updateAt: Date;
  user: CommentUserView;
  replyToUser: CommentUserView | null;
  replies?: CommentView[];
}

const toUserView = (user: Users): CommentUserView => ({
  id: user.id,
  username: user.username,
  avatarUrl: user.avatarUrl,
});

export function toCommentView(comment: Comments): CommentView {
  const deleted = comment.status === ActiveStatus.INACTIVE;
  return {
    id: Number(comment.id),
    parentId: comment.parent ? Number(comment.parent.id) : null,
    content: deleted ? null : comment.content,
    deleted,
    createdAt: comment.createdAt,
    updateAt: comment.updateAt,
    user: toUserView(comment.user),
    replyToUser: comment.replyToUser ? toUserView(comment.replyToUser) : null,
  };
}
