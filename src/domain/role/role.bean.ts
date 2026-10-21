import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleForm } from '../forms';
import { PermissionBean } from '../permission/permission.bean';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Roles } from './entity/role.entity';

@Injectable()
export class RoleBean {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly permissionBean: PermissionBean,
  ) {}

  findAll() {
    return this.roleRepository.find({ order: { id: 'ASC' } });
  }

  async search(keyword: string, page: number) {
    const query = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .orderBy('role.id', 'ASC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.where('role.name ILIKE :like', { like: likeOf(keyword) });
    }
    const [roles, total] = await query.getManyAndCount();
    return { roles, total };
  }

  async findById(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    return role;
  }

  async create(form: RoleForm) {
    const name = await this.readValidName(form);
    return this.roleRepository.save(this.roleRepository.create({ name }));
  }

  async rename(id: number, form: RoleForm) {
    const role = await this.findById(id);
    role.name = await this.readValidName(form, id);
    return this.roleRepository.save(role);
  }

  async assignPermissions(id: number, form: RoleForm) {
    const role = await this.findById(id);
    const permissionIds = (form?.permissionIds ?? []).map(Number);
    role.permissions = await this.permissionBean.findByIds(permissionIds);
    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    if (role.users.length) {
      throw new BadRequestException(
        `Vai trò ${role.name} đang gán cho ${role.users.length} người dùng, hãy gán lại trước khi xóa`,
      );
    }
    await this.roleRepository.remove(role);
    return role;
  }

  private async readValidName(form: RoleForm, ownId?: number) {
    const name = (form.name ?? '').trim();
    if (!name) throw new BadRequestException('Cần nhập tên vai trò');
    const sameName = await this.roleRepository
      .createQueryBuilder('role')
      .where('LOWER(role.name) = LOWER(:name)', { name })
      .getOne();
    if (sameName && sameName.id !== ownId) {
      throw new BadRequestException(`Vai trò ${name} đã tồn tại`);
    }
    return name;
  }
}
