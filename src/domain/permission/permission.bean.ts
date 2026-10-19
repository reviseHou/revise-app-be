import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PermissionForm } from '../forms';
import { Permissions } from './entity/permission.entity';

@Injectable()
export class PermissionBean {
  constructor(
    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  findAll() {
    return this.permissionRepository.find({ order: { name: 'ASC' } });
  }

  async findByIds(ids: number[]) {
    if (!ids.length) return [];
    return this.permissionRepository.find({ where: { id: In(ids) } });
  }

  async create(form: PermissionForm) {
    const name = (form.name ?? '').trim();
    if (!name) throw new BadRequestException('Cần nhập tên quyền');
    await this.assertNameNotUsed(name);
    return this.permissionRepository.save(
      this.permissionRepository.create({ name }),
    );
  }

  private async assertNameNotUsed(name: string) {
    if (await this.permissionRepository.existsBy({ name })) {
      throw new BadRequestException(`Quyền ${name} đã tồn tại`);
    }
  }
}
