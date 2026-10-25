import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleForm, listOf } from '../forms';
import { PermissionBean } from '../permission/permission.bean';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { RolePermissions } from './entity/role-permission.entity';
import { Roles } from './entity/role.entity';

@Injectable()
export class RoleBean {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly permissionBean: PermissionBean,
  ) {}

  findAll() {
    return this.roleRepository.find({
      order: { id: 'ASC' },
      relations: { rolePermissions: { permission: true } },
    });
  }

  async search(keyword: string, page: number) {
    const query = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .orderBy('role.dateCreated', 'DESC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.where('(role.code ILIKE :like OR role.name ILIKE :like)', {
        like: likeOf(keyword),
      });
    }
    const [roles, total] = await query.getManyAndCount();
    return { roles, total };
  }

  async findById(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');
    return role;
  }

  async create(form: RoleForm) {
    const fields = await this.readValidForm(form);
    return this.roleRepository.save(this.roleRepository.create(fields));
  }

  async update(id: number, form: RoleForm) {
    const role = await this.findById(id);
    Object.assign(role, await this.readValidForm(form, id));
    return this.roleRepository.save(role);
  }

  async assignPermissions(id: number, form: RoleForm) {
    const role = await this.findById(id);
    const permissionIds = listOf(form?.permissionIds).map(Number);
    const permissions = await this.permissionBean.findByIds(permissionIds);
    await this.roleRepository.manager.transaction(async (manager) => {
      await manager.delete(RolePermissions, { role: { id: role.id } });
      if (permissions.length) {
        await manager.save(
          permissions.map((permission) =>
            manager.create(RolePermissions, { role, permission }),
          ),
        );
      }
    });
    return role;
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

  private async readValidForm(form: RoleForm, ownId?: number) {
    const code = (form.code ?? '').trim().toUpperCase();
    const name = (form.name ?? '').trim();
    const description = (form.description ?? '').trim() || null;
    if (!code) throw new BadRequestException('Cần nhập mã vai trò');
    if (!name) throw new BadRequestException('Cần nhập tên vai trò');
    const sameCode = await this.roleRepository.findOneBy({ code });
    if (sameCode && sameCode.id !== ownId) {
      throw new BadRequestException(`Vai trò ${code} đã tồn tại`);
    }
    return { code, name, description };
  }
}
