import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAGE_SIZE } from '../paging';
import { AssignRoleForm } from '../forms';
import { RoleBean } from '../role/role.bean';
import { Users } from './entity/user.entity';

export interface UserCountOfRole {
  roleId: number | null;
  roleName: string;
  count: number;
}

@Injectable()
export class UserBean {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly roleBean: RoleBean,
  ) {}

  count() {
    return this.userRepository.count();
  }

  countWithRole(roleId: number) {
    return this.userRepository.count({ where: { role: { id: roleId } } });
  }

  async countByRole(): Promise<UserCountOfRole[]> {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select('role.id', 'roleId')
      .addSelect("COALESCE(role.name, '(chưa có vai trò)')", 'roleName')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('role.id')
      .addGroupBy('role.name')
      .orderBy('COUNT(user.id)', 'DESC')
      .getRawMany<{ roleId: number | null; roleName: string; count: string }>();
    return rows.map((row) => ({ ...row, count: Number(row.count) }));
  }

  async search(keyword: string, page: number) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.id', 'DESC')
      .skip((page - 1) * PAGE_SIZE)
      .take(PAGE_SIZE);
    if (keyword) {
      query.where(
        '(user.username ILIKE :keyword OR user.email ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    const [users, total] = await query.getManyAndCount();
    return { users, total };
  }

  async assignRole(userId: number, form: AssignRoleForm) {
    const user = await this.findById(userId);
    const role = form.roleId
      ? await this.roleBean.findById(Number(form.roleId))
      : null;
    Object.assign(user, { role });
    return this.userRepository.save(user);
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }
}
