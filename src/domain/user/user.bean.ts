import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacultyBean } from '../faculty/faculty.bean';
import { AssignRoleForm } from '../forms';
import { RoleBean } from '../role/role.bean';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
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
    private readonly facultyBean: FacultyBean,
  ) {}

  count() {
    return this.userRepository.count();
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

  async search(keyword: string, page: number, roleId?: number) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.faculty', 'faculty')
      .orderBy('user.dateCreated', 'DESC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    if (keyword) {
      query.where('(user.fullName ILIKE :like OR user.email ILIKE :like)', {
        like: likeOf(keyword),
      });
    }
    if (roleId) query.andWhere('role.id = :roleId', { roleId });
    const [users, total] = await query.getManyAndCount();
    return { users, total };
  }

  async assignRole(userId: string, form: AssignRoleForm) {
    if (!form.roleId) throw new BadRequestException('Cần chọn vai trò');
    const user = await this.findById(userId);
    user.role = await this.roleBean.findById(Number(form.roleId));
    user.faculty = form.facultyId
      ? await this.facultyBean.findById(Number(form.facultyId))
      : null;
    return this.userRepository.save(user);
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'faculty'],
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }
}
