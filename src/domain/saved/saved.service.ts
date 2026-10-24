import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Documents } from '../document/entity/document.entity';
import { DocumentStatus, QuizStatus, SourceType } from '../enums';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { QuizzesService } from '../quiz/quizzes.service';
import { Users } from '../user/entity/user.entity';
import { SavedItemDto } from './dto/saved.dto';
import { SavedItems } from './entity/saved-item.entity';

const orderOf = (ids: number[]) => {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return <T extends { id: number | string }>(a: T, b: T) =>
    (rank.get(Number(a.id)) ?? 0) - (rank.get(Number(b.id)) ?? 0);
};

@Injectable()
export class SavedService {
  constructor(
    private readonly quizzesService: QuizzesService,
    @InjectRepository(SavedItems)
    private readonly savedRepository: Repository<SavedItems>,
    @InjectRepository(Documents)
    private readonly documentsRepository: Repository<Documents>,
    @InjectRepository(Quizzes)
    private readonly quizzesRepository: Repository<Quizzes>,
  ) {}

  async keys(user: Users) {
    const items = await this.savedRepository.find({
      where: { user: { id: user.id } },
      order: { dateCreated: 'DESC' },
    });
    return items.map((item) => ({
      sourceType: item.sourceType,
      sourceId: Number(item.sourceId),
    }));
  }

  async list(user: Users) {
    const keys = await this.keys(user);
    const idsOf = (type: SourceType) =>
      keys.filter((key) => key.sourceType === type).map((key) => key.sourceId);
    const documentIds = idsOf(SourceType.DOCUMENT);
    const quizIds = idsOf(SourceType.QUIZ);

    const [documents, quizzes] = await Promise.all([
      documentIds.length
        ? this.documentsRepository.find({
            where: {
              id: In(documentIds.map(String)),
              status: DocumentStatus.ACTIVE,
            },
            relations: ['subject', 'uploader'],
          })
        : Promise.resolve([]),
      this.quizzesService.listByIds(quizIds),
    ]);

    return {
      documents: documents.sort(orderOf(documentIds)),
      quizzes: quizzes.sort(orderOf(quizIds)),
    };
  }

  async save(user: Users, key: SavedItemDto) {
    await this.assertSourceExists(key.sourceType, key.sourceId);
    await this.savedRepository
      .createQueryBuilder()
      .insert()
      .into(SavedItems)
      .values({
        user: { id: user.id },
        sourceType: key.sourceType,
        sourceId: String(key.sourceId),
      })
      .orIgnore()
      .execute();
    return { ...key, saved: true };
  }

  async remove(user: Users, key: SavedItemDto) {
    await this.savedRepository.delete({
      user: { id: user.id },
      sourceType: key.sourceType,
      sourceId: String(key.sourceId),
    });
    return { ...key, saved: false };
  }

  private async assertSourceExists(sourceType: SourceType, sourceId: number) {
    const exists =
      sourceType === SourceType.DOCUMENT
        ? await this.documentsRepository.existsBy({
            id: String(sourceId),
            status: DocumentStatus.ACTIVE,
          })
        : await this.quizzesRepository.existsBy({
            id: sourceId,
            status: QuizStatus.ACTIVE,
          });
    if (!exists) throw new NotFoundException('Không tìm thấy nội dung để lưu');
  }
}
