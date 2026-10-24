import { ActiveStatus } from '../enums';
import { Users } from '../user/entity/user.entity';
import { Comments } from './entity/comment.entity';

export interface CommentUserView {
  id: string;
  fullName: string;
  avatar?: string | null;
}

export interface CommentView {
  id: number;
  parentId: number | null;
  content: string | null;
  deleted: boolean;
  dateCreated: Date;
  dateModified: Date;
  user: CommentUserView;
  replyToUser: CommentUserView | null;
  replies?: CommentView[];
}

const toUserView = (user: Users): CommentUserView => ({
  id: user.id,
  fullName: user.fullName,
  avatar: user.avatar,
});

export function toCommentView(comment: Comments): CommentView {
  const deleted = comment.status === ActiveStatus.INACTIVE;
  return {
    id: Number(comment.id),
    parentId: comment.parent ? Number(comment.parent.id) : null,
    content: deleted ? null : comment.content,
    deleted,
    dateCreated: comment.dateCreated,
    dateModified: comment.dateModified,
    user: toUserView(comment.user),
    replyToUser: comment.replyToUser ? toUserView(comment.replyToUser) : null,
  };
}
