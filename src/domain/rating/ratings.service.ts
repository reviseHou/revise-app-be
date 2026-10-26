import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documents } from '../document/entity/document.entity';
import { DocumentStatus, QuizStatus, SourceType } from '../enums';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { Users } from '../user/entity/user.entity';
import { SourceKeyDto } from '../validation';
import { RateDto } from './dto/ratings.dto';
import { Ratings } from './entity/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Ratings)
    private readonly ratingsRepository: Repository<Ratings>,
    @InjectRepository(Documents)
    private readonly documentsRepository: Repository<Documents>,
    @InjectRepository(Quizzes)
    private readonly quizzesRepository: Repository<Quizzes>,
  ) {}

  async summary(user: Users, { sourceType, sourceId }: SourceKeyDto) {
    const [totals, mine] = await Promise.all([
      this.ratingsRepository
        .createQueryBuilder('rating')
        .select('AVG(rating.star)', 'average')
        .addSelect('COUNT(rating.id)', 'count')
        .where('rating.sourceType = :sourceType', { sourceType })
        .andWhere('rating.sourceId = :sourceId', { sourceId: String(sourceId) })
        .getRawOne<{ average: string | null; count: string }>(),
      this.ratingsRepository.findOneBy({
        user: { id: user.id },
        sourceType,
        sourceId: String(sourceId),
      }),
    ]);
    return {
      average: Math.round(Number(totals?.average ?? 0) * 10) / 10,
      count: Number(totals?.count ?? 0),
      myStar: mine?.star ?? null,
    };
  }

  async rate(user: Users, { star, ...key }: RateDto) {
    await this.assertSourceExists(key.sourceType, key.sourceId);
    await this.ratingsRepository
      .createQueryBuilder()
      .insert()
      .into(Ratings)
      .values({
        user: { id: user.id },
        sourceType: key.sourceType,
        sourceId: String(key.sourceId),
        star,
      })
      .orUpdate(
        ['star', 'date_modified'],
        ['source_type', 'source_id', 'user_id'],
      )
      .execute();
    return this.summary(user, key);
  }

  async remove(user: Users, key: SourceKeyDto) {
    await this.ratingsRepository.delete({
      user: { id: user.id },
      sourceType: key.sourceType,
      sourceId: String(key.sourceId),
    });
    return this.summary(user, key);
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
    if (!exists) {
      throw new NotFoundException('Không tìm thấy nội dung để đánh giá');
    }
  }
}
