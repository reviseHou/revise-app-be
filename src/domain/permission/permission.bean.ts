import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PermissionForm } from '../forms';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Permissions } from './entity/permission.entity';

@Injectable()
export class PermissionBean {
  constructor(
    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  async search(keyword: string, page: number) {
    const query = this.permissionRepository
      .createQueryBuilder('permission')
      .orderBy('permission.code', 'ASC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.where(
        '(permission.code ILIKE :like OR permission.name ILIKE :like)',
        { like: likeOf(keyword) },
      );
    }
    const [permissions, total] = await query.getManyAndCount();
    return { permissions, total };
  }

  findAll() {
    return this.permissionRepository.find({ order: { code: 'ASC' } });
  }

  async findByIds(ids: number[]) {
    if (!ids.length) return [];
    return this.permissionRepository.find({ where: { id: In(ids) } });
  }

  async create(form: PermissionForm) {
    const code = (form.code ?? '').trim().toUpperCase();
    const name = (form.name ?? '').trim();
    const description = (form.description ?? '').trim() || null;
    if (!code) throw new BadRequestException('Cần nhập mã quyền');
    if (!name) throw new BadRequestException('Cần nhập tên quyền');
    if (await this.permissionRepository.existsBy({ code })) {
      throw new BadRequestException(`Quyền ${code} đã tồn tại`);
    }
    return this.permissionRepository.save(
      this.permissionRepository.create({ code, name, description }),
    );
  }
}
