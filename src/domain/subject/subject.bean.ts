import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus } from '../enums';
import { SubjectForm } from '../forms';
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

  async search(keyword: string, facultyId: number | undefined, page: number) {
    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .orderBy('subject.name', 'ASC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.andWhere('(subject.name ILIKE :like OR subject.code ILIKE :like)', {
        like: likeOf(keyword),
      });
    }
    if (facultyId) query.andWhere('faculty.id = :facultyId', { facultyId });
    const [subjects, total] = await query.getManyAndCount();
    return { subjects, total };
  }

  async countByFaculty() {
    const rows = await this.subjectRepository
      .createQueryBuilder('subject')
      .innerJoin('subject.major', 'major')
      .innerJoin('major.faculty', 'faculty')
      .select('faculty.id', 'facultyId')
      .addSelect('COUNT(subject.id)', 'count')
      .groupBy('faculty.id')
      .getRawMany<{ facultyId: number; count: string }>();
    return new Map(rows.map((row) => [row.facultyId, Number(row.count)]));
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
    const fields = await this.readValidForm(form);
    return this.subjectRepository.save(
      this.subjectRepository.create({ ...fields, major }),
    );
  }

  async update(id: number, form: SubjectForm) {
    const subject = await this.findById(id);
    Object.assign(subject, await this.readValidForm(form, id));
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
        `Môn ${subject.name} còn ${subject.documents.length} tài liệu, không thể xóa. Hãy ẩn môn học thay vì xóa`,
      );
    }
    await this.subjectRepository.remove(subject);
    return subject;
  }

  private async readValidForm(form: SubjectForm, ownId?: number) {
    const name = (form.name ?? '').trim();
    const code = (form.code ?? '').trim().toUpperCase();
    if (!name) throw new BadRequestException('Cần nhập tên môn học');
    if (!code) throw new BadRequestException('Cần nhập mã môn học');
    await this.assertCodeNotUsed(code, ownId);
    const creditText = (form.credit ?? '').trim();
    const credit = creditText ? Number(creditText) : null;
    if (credit !== null && (!Number.isInteger(credit) || credit < 0)) {
      throw new BadRequestException('Số tín chỉ không hợp lệ');
    }
    return {
      name,
      code,
      credit,
      description: form.description?.trim() || null,
    };
  }

  private async assertCodeNotUsed(code: string, ownId?: number) {
    const sameCode = await this.subjectRepository.findOne({ where: { code } });
    if (sameCode && sameCode.id !== ownId) {
      throw new BadRequestException(`Mã môn ${code} đã tồn tại`);
    }
  }
}
