import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus } from '../enums';
import { CatalogForm } from '../forms';
import { Faculties } from './entity/faculty.entity';

@Injectable()
export class FacultyBean {
  constructor(
    @InjectRepository(Faculties)
    private readonly facultyRepository: Repository<Faculties>,
  ) {}

  count() {
    return this.facultyRepository.count();
  }

  async findAllWithMajorCount() {
    const result = await this.facultyRepository
      .createQueryBuilder('faculty')
      .leftJoin('faculty.majors', 'major')
      .select([
        'faculty.id',
        'faculty.code',
        'faculty.name',
        'faculty.description',
        'faculty.status',
      ])
      .addSelect('COUNT(major.id)', 'majorCount')
      .groupBy('faculty.id')
      .orderBy('faculty.code', 'ASC')
      .getRawAndEntities();
    const rows = result.raw as { majorCount: string }[];
    return result.entities.map((faculty, index) => ({
      ...faculty,
      majorCount: Number(rows[index].majorCount),
    }));
  }

  async findById(id: number) {
    const faculty = await this.facultyRepository.findOne({ where: { id } });
    if (!faculty) throw new NotFoundException('Không tìm thấy khoa');
    return faculty;
  }

  async create(form: CatalogForm) {
    const { code, name, description } = await this.readValidForm(form);
    return this.facultyRepository.save(
      this.facultyRepository.create({ code, name, description }),
    );
  }

  async update(id: number, form: CatalogForm) {
    const faculty = await this.findById(id);
    const { code, name, description } = await this.readValidForm(form, id);
    Object.assign(faculty, { code, name, description });
    return this.facultyRepository.save(faculty);
  }

  async toggleStatus(id: number) {
    const faculty = await this.findById(id);
    faculty.status =
      faculty.status === ActiveStatus.ACTIVE
        ? ActiveStatus.INACTIVE
        : ActiveStatus.ACTIVE;
    return this.facultyRepository.save(faculty);
  }

  private async readValidForm(form: CatalogForm, ownId?: number) {
    const code = (form.code ?? '').trim().toUpperCase();
    const name = (form.name ?? '').trim();
    if (!code || !name) {
      throw new BadRequestException('Cần nhập mã và tên khoa');
    }
    await this.assertCodeNotUsed(code, ownId);
    return { code, name, description: form.description?.trim() || null };
  }

  private async assertCodeNotUsed(code: string, ownId?: number) {
    const sameCode = await this.facultyRepository.findOne({ where: { code } });
    if (sameCode && sameCode.id !== ownId) {
      throw new BadRequestException(`Mã khoa ${code} đã tồn tại`);
    }
  }
}
