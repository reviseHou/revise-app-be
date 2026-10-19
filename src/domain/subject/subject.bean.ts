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

  findAll() {
    return this.subjectRepository.find({
      relations: ['major', 'major.faculty'],
      order: { title: 'ASC' },
    });
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
