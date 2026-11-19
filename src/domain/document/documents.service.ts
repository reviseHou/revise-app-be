import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documents } from 'src/domain/document/entity/document.entity';
import {
  DocumentCategory,
  DocumentSort,
  DocumentStatus,
} from 'src/domain/enums';
import { Users } from 'src/domain/user/entity/user.entity';
import { Raw, Repository } from 'typeorm';
import { Subjects } from '../subject/entity/subject.entity';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/documents.dto';
import { DocumentViews } from './entity/document-view.entity';

const WITH_RELATIONS = ['uploader', 'subject'];

const VIEW_WINDOW_MINUTES = 30;

// Approved content (ACTIVE, or INACTIVE after being hidden) can only be deleted, not edited.
const EDITABLE_STATUSES = [DocumentStatus.PENDING, DocumentStatus.REJECTED];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Documents)
    private documentsRepository: Repository<Documents>,
    @InjectRepository(DocumentViews)
    private viewsRepository: Repository<DocumentViews>,
  ) {}

  async create(dto: CreateDocumentDto, user: Users) {
    const { subjectId, ...fields } = dto;
    const document = await this.documentsRepository.save(
      this.documentsRepository.create({
        ...fields,
        uploader: { id: user.id },
        subject: { id: subjectId },
      }),
    );
    return this.findOne(Number(document.id));
  }

  findAll(
    category?: DocumentCategory,
    sort = DocumentSort.NEWEST,
    limit?: number,
    offset?: number,
  ) {
    return this.findActive({ category, sort, limit, offset });
  }

  async findOne(id: number, withViewCount = false) {
    const document = await this.documentsRepository.findOne({
      where: { id: String(id) },
      relations: WITH_RELATIONS,
    });
    if (!document) throw new NotFoundException('Không tìm thấy tài liệu');
    if (!withViewCount) return document;
    return Object.assign(document, { viewCount: await this.countViews(id) });
  }

  findByUploaderId(uploaderId: string) {
    return this.documentsRepository.find({
      where: { uploader: { id: uploaderId } },
      relations: WITH_RELATIONS,
    });
  }

  findBySubjectId(
    subjectId: number,
    category?: DocumentCategory,
    sort = DocumentSort.NEWEST,
  ) {
    return this.findActive({ subjectId, category, sort });
  }

  private async findActive({
    subjectId,
    category,
    sort = DocumentSort.NEWEST,
    limit,
    offset,
  }: {
    subjectId?: number;
    category?: DocumentCategory;
    sort?: DocumentSort;
    limit?: number;
    offset?: number;
  }) {
    const query = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploader', 'uploader')
      .leftJoinAndSelect('document.subject', 'subject')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(view.id)')
            .from(DocumentViews, 'view')
            .where('view.document_id = document.id'),
        'view_count',
      )
      .where('document.status = :status', { status: DocumentStatus.ACTIVE });
    if (subjectId) query.andWhere('subject.id = :subjectId', { subjectId });
    if (category) query.andWhere('document.category = :category', { category });
    if (limit) query.limit(limit);
    if (offset) query.offset(offset);
    if (sort === DocumentSort.VIEWS) query.orderBy('view_count', 'DESC');
    query.addOrderBy(
      'document.dateCreated',
      sort === DocumentSort.OLDEST ? 'ASC' : 'DESC',
    );

    const { entities, raw } = await query.getRawAndEntities<{
      document_id: string;
      view_count: string;
    }>();
    const viewCountById = new Map(
      raw.map((row) => [String(row.document_id), Number(row.view_count)]),
    );
    return entities.map((document) =>
      Object.assign(document, {
        viewCount: viewCountById.get(document.id) ?? 0,
      }),
    );
  }

  async addView(id: number, user: Users) {
    const viewable = await this.documentsRepository.existsBy({
      id: String(id),
      status: DocumentStatus.ACTIVE,
    });
    if (!viewable) throw new NotFoundException('Không tìm thấy tài liệu');

    const viewedRecently = await this.viewsRepository.existsBy({
      document: { id: String(id) },
      user: { id: user.id },
      // so sánh bằng now() của DB vì date_created lưu theo giờ DB, không theo giờ máy chủ Node
      dateCreated: Raw(
        (column) =>
          `${column} > now() - interval '${VIEW_WINDOW_MINUTES} minutes'`,
      ),
    });
    if (!viewedRecently) {
      await this.viewsRepository.save(
        this.viewsRepository.create({
          document: { id: String(id) },
          user: { id: user.id },
        }),
      );
    }
    return { viewCount: await this.countViews(id) };
  }

  async update(id: number, dto: UpdateDocumentDto, user: Users) {
    const document = await this.findOne(id);
    this.assertUploader(document, user);
    if (!EDITABLE_STATUSES.includes(document.status)) {
      throw new ConflictException(
        'Tài liệu đã được duyệt nên không thể chỉnh sửa. Bạn có thể xóa và tải lên lại.',
      );
    }
    const { subjectId, ...fields } = dto;
    this.documentsRepository.merge(document, fields);
    if (subjectId) document.subject = { id: subjectId } as Subjects;
    document.status = DocumentStatus.PENDING;
    document.rejectReason = null;
    document.reviewedBy = null;
    document.dateReviewed = null;
    return this.documentsRepository.save(document);
  }

  async remove(id: number, user: Users) {
    const document = await this.findOne(id);
    this.assertUploader(document, user);
    await this.documentsRepository.remove(document);
    return document;
  }

  private assertUploader(document: Documents, user: Users) {
    if (document.uploader?.id !== user.id) {
      throw new ForbiddenException(
        'Chỉ người đăng mới được sửa hoặc xóa tài liệu',
      );
    }
  }

  private countViews(id: number) {
    return this.viewsRepository.countBy({ document: { id: String(id) } });
  }
}
