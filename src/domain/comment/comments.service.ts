import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documents } from '../document/entity/document.entity';
import { ActiveStatus, SourceType, QuizStatus } from '../enums';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { Users } from '../user/entity/user.entity';
import { CommentView, toCommentView } from './comment.view';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';
import { Comments } from './entity/comment.entity';

const MAX_CONTENT = 1000;

function parseSource(sourceType: unknown, sourceId: unknown) {
  if (!Object.values(SourceType).includes(sourceType as SourceType)) {
    throw new BadRequestException('sourceType phải là DOCUMENT hoặc QUIZ');
  }
  const id = Number(sourceId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('sourceId không hợp lệ');
  }
  return { sourceType: sourceType as SourceType, sourceId: id };
}

function parseContent(content: unknown) {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text)
    throw new BadRequestException('Nội dung bình luận không được trống');
  if (text.length > MAX_CONTENT) {
    throw new BadRequestException(`Bình luận tối đa ${MAX_CONTENT} ký tự`);
  }
  return text;
}

function optionalId(value: unknown, field: string) {
  if (value === undefined || value === null) return undefined;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(`${field} không hợp lệ`);
  }
  return id;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comments)
    private readonly commentsRepository: Repository<Comments>,
    @InjectRepository(Documents)
    private readonly documentsRepository: Repository<Documents>,
    @InjectRepository(Quizzes)
    private readonly quizzesRepository: Repository<Quizzes>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async list(sourceTypeInput: unknown, sourceIdInput: unknown) {
    const { sourceType, sourceId } = parseSource(
      sourceTypeInput,
      sourceIdInput,
    );
    const comments = await this.commentsRepository.find({
      where: { sourceType, sourceId: String(sourceId) },
      relations: ['user', 'parent', 'replyToUser'],
      order: { createdAt: 'ASC' },
    });

    const roots: CommentView[] = [];
    const repliesByRoot = new Map<number, CommentView[]>();
    for (const comment of comments) {
      const view = toCommentView(comment);
      if (view.parentId === null) roots.push(view);
      else {
        const list = repliesByRoot.get(view.parentId) ?? [];
        if (!view.deleted) list.push(view);
        repliesByRoot.set(view.parentId, list);
      }
    }

    return roots
      .map((root) => ({ ...root, replies: repliesByRoot.get(root.id) ?? [] }))
      .filter((root) => !root.deleted || root.replies.length > 0)
      .reverse();
  }

  async create(user: Users, body: CreateCommentDto): Promise<CommentView> {
    const { sourceType, sourceId } = parseSource(
      body?.sourceType,
      body?.sourceId,
    );
    const content = parseContent(body?.content);
    const parentId = optionalId(body?.parentId, 'parentId');
    const replyToUserId = optionalId(body?.replyToUserId, 'replyToUserId');

    await this.assertSourceExists(sourceType, sourceId);
    const parent = parentId
      ? await this.findRootParent(parentId, sourceType, sourceId)
      : null;
    const replyToUser = replyToUserId
      ? await this.usersRepository.findOneBy({ id: replyToUserId })
      : null;
    if (replyToUserId && !replyToUser) {
      throw new BadRequestException('Người được nhắc tới không tồn tại');
    }

    const saved = await this.commentsRepository.save(
      this.commentsRepository.create({
        sourceType,
        sourceId: String(sourceId),
        user: { id: user.id },
        parent,
        replyToUser,
        content,
      }),
    );
    return this.view(saved.id);
  }

  async update(user: Users, id: number, body: UpdateCommentDto) {
    const comment = await this.findOwnedActive(user, id);
    comment.content = parseContent(body?.content);
    await this.commentsRepository.save(comment);
    return this.view(comment.id);
  }

  async remove(user: Users, id: number) {
    const comment = await this.findOwnedActive(user, id);
    comment.status = ActiveStatus.INACTIVE;
    await this.commentsRepository.save(comment);
    return { id };
  }

  private async view(id: string) {
    const comment = await this.commentsRepository.findOneOrFail({
      where: { id },
      relations: ['user', 'parent', 'replyToUser'],
    });
    return toCommentView(comment);
  }

  private async findOwnedActive(user: Users, id: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id: String(id), status: ActiveStatus.ACTIVE },
      relations: ['user'],
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    if (comment.user.id !== user.id) {
      throw new ForbiddenException('Chỉ người viết mới được sửa hoặc xóa');
    }
    return comment;
  }

  private async findRootParent(
    parentId: number,
    sourceType: SourceType,
    sourceId: number,
  ) {
    const parent = await this.commentsRepository.findOne({
      where: { id: String(parentId) },
      relations: ['parent'],
    });
    if (
      !parent ||
      parent.sourceType !== sourceType ||
      Number(parent.sourceId) !== sourceId
    ) {
      throw new BadRequestException('Bình luận cha không hợp lệ');
    }
    return parent.parent ?? parent;
  }

  private async assertSourceExists(sourceType: SourceType, sourceId: number) {
    const exists =
      sourceType === SourceType.DOCUMENT
        ? await this.documentsRepository.existsBy({ id: sourceId })
        : await this.quizzesRepository.existsBy({
            id: sourceId,
            status: QuizStatus.ACTIVE,
          });
    if (!exists)
      throw new NotFoundException('Không tìm thấy nội dung để bình luận');
  }
}
