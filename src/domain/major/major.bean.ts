import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus } from '../enums';
import { FacultyBean } from '../faculty/faculty.bean';
import { CatalogForm, MajorForm } from '../forms';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Majors } from './entity/major.entity';

@Injectable()
export class MajorBean {
  constructor(
    @InjectRepository(Majors)
    private readonly majorRepository: Repository<Majors>,
    private readonly facultyBean: FacultyBean,
  ) {}

  async search(keyword: string, page: number) {
    const query = this.majorRepository
      .createQueryBuilder('major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .orderBy('major.code', 'ASC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.where('(major.code ILIKE :like OR major.name ILIKE :like)', {
        like: likeOf(keyword),
      });
    }
    const [majors, total] = await query.getManyAndCount();
    return { majors, total };
  }

  findAll() {
    return this.majorRepository.find({
      relations: ['faculty'],
      order: { code: 'ASC' },
    });
  }

  async findById(id: number) {
    const major = await this.majorRepository.findOne({
      where: { id },
      relations: ['faculty'],
    });
    if (!major) throw new NotFoundException('Không tìm thấy ngành');
    return major;
  }

  async create(form: MajorForm) {
    const faculty = await this.facultyBean.findById(Number(form.facultyId));
    const { code, name, description } = await this.readValidForm(form);
    return this.majorRepository.save(
      this.majorRepository.create({ code, name, description, faculty }),
    );
  }

  async update(id: number, form: MajorForm) {
    const major = await this.findById(id);
    const { code, name, description } = await this.readValidForm(form, id);
    Object.assign(major, { code, name, description });
    if (form.facultyId) {
      major.faculty = await this.facultyBean.findById(Number(form.facultyId));
    }
    return this.majorRepository.save(major);
  }

  async toggleStatus(id: number) {
    const major = await this.findById(id);
    major.status =
      major.status === ActiveStatus.ACTIVE
        ? ActiveStatus.INACTIVE
        : ActiveStatus.ACTIVE;
    return this.majorRepository.save(major);
  }

  private async readValidForm(form: CatalogForm, ownId?: number) {
    const code = (form.code ?? '').trim().toUpperCase();
    const name = (form.name ?? '').trim();
    if (!code || !name) {
      throw new BadRequestException('Cần nhập mã và tên ngành');
    }
    await this.assertCodeNotUsed(code, ownId);
    return { code, name, description: form.description?.trim() || null };
  }

  private async assertCodeNotUsed(code: string, ownId?: number) {
    const sameCode = await this.majorRepository.findOne({ where: { code } });
    if (sameCode && sameCode.id !== ownId) {
      throw new BadRequestException(`Mã ngành ${code} đã tồn tại`);
    }
  }
}
