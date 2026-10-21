import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ActiveStatus } from '../enums';
import { CatalogForm, SubjectForm } from '../forms';
import { MajorBean } from '../major/major.bean';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Subjects } from './entity/subject.entity';

@Injectable()
export class SubjectBean {
  constructor(
    @InjectRepository(Subjects)
    private readonly subjectRepository: Repository<Subjects>,
    private readonly majorBean: MajorBean,
  ) {}

  count() {
    return this.subjectRepository.count();
  }

  async search(keyword: string, facultyId: number | undefined, page: number) {
    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .orderBy('subject.title', 'ASC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.andWhere(
        '(subject.title ILIKE :like OR subject.code ILIKE :like)',
        {
          like: likeOf(keyword),
        },
      );
    }
    if (facultyId) query.andWhere('faculty.id = :facultyId', { facultyId });
    const [subjects, total] = await query.getManyAndCount();
    return { subjects, total };
  }

  findAll(facultyId?: number) {
    return this.subjectRepository.find({
      where: facultyId ? { major: { faculty: { id: facultyId } } } : {},
      relations: ['major', 'major.faculty'],
      order: { title: 'ASC' },
    });
  }

  async countByFaculty() {
    const rows = await this.subjectRepository
      .createQueryBuilder('subject')
      .innerJoin('subject.major', 'major')
      .select('major.facultyId', 'facultyId')
      .addSelect('COUNT(subject.id)', 'count')
      .groupBy('major.facultyId')
      .getRawMany<{ facultyId: number; count: string }>();
    return new Map(rows.map((row) => [row.facultyId, Number(row.count)]));
  }

  findByMajor(majorId: number) {
    return this.subjectRepository.find({
      where: { major: { id: majorId } },
      order: { code: 'ASC', title: 'ASC' },
    });
  }

  findWithoutMajor() {
    return this.subjectRepository.find({
      where: { major: IsNull() },
      order: { title: 'ASC' },
    });
  }

  async findById(id: number) {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['major'],
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học');
    return subject;
  }

  async create(form: SubjectForm) {
    const major = await this.majorBean.findById(Number(form.majorId));
    const { title, code, description } = await this.readValidForm(form);
    return this.subjectRepository.save(
      this.subjectRepository.create({ title, code, description, major }),
    );
  }

  async update(id: number, form: SubjectForm) {
    const subject = await this.findById(id);
    const { title, code, description } = await this.readValidForm(form, id);
    Object.assign(subject, { title, code, description });
    if (form.majorId) {
      subject.major = await this.majorBean.findById(Number(form.majorId));
    }
    return this.subjectRepository.save(subject);
  }

  async toggleStatus(id: number) {
    const subject = await this.findById(id);
    subject.status =
      subject.status === ActiveStatus.ACTIVE
        ? ActiveStatus.INACTIVE
        : ActiveStatus.ACTIVE;
    return this.subjectRepository.save(subject);
  }

  async remove(id: number) {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['documents'],
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học');
    if (subject.documents.length) {
      throw new BadRequestException(
        `Môn ${subject.title} còn ${subject.documents.length} tài liệu, không thể xóa. Hãy ẩn môn học thay vì xóa`,
      );
    }
    await this.subjectRepository.remove(subject);
    return subject;
  }

  private async readValidForm(form: CatalogForm, ownId?: number) {
    const title = (form.name ?? '').trim();
    const code = (form.code ?? '').trim().toUpperCase() || null;
    if (!title) throw new BadRequestException('Cần nhập tên môn học');
    if (code) await this.assertCodeNotUsed(code, ownId);
    return { title, code, description: form.description?.trim() ?? '' };
  }

  private async assertCodeNotUsed(code: string, ownId?: number) {
    const sameCode = await this.subjectRepository.findOne({ where: { code } });
    if (sameCode && sameCode.id !== ownId) {
      throw new BadRequestException(`Mã môn ${code} đã tồn tại`);
    }
  }
}
