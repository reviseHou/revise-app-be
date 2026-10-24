import {
  Body,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { FacultyBean } from 'src/domain/faculty/faculty.bean';
import type { AssignRoleForm } from 'src/domain/forms';
import { RoleBean } from 'src/domain/role/role.bean';
import { UserBean } from 'src/domain/user/user.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';

const LIST = '/cms/users';

@CmsController('cms/users')
export class UserController {
  constructor(
    private readonly userBean: UserBean,
    private readonly roleBean: RoleBean,
    private readonly facultyBean: FacultyBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_USER, 'user/list')
  async showUserList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('roleId') roleIdParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const roleId = Number(roleIdParam) || undefined;
    const [{ users, total }, roleCounts, userCount] = await Promise.all([
      this.userBean.search(keyword, page, roleId),
      this.userBean.countByRole(),
      this.userBean.count(),
    ]);
    return { users, total, keyword, page, roleCounts, userCount, roleId };
  }

  @Get(':id/edit')
  @CmsView(CmsPermission.ASSIGN_ROLE, 'user/form')
  async showEditForm(@Param('id') id: string) {
    const [account, roles, faculties] = await Promise.all([
      this.userBean.findById(id),
      this.roleBean.findAll(),
      this.facultyBean.findAllWithMajorCount(),
    ]);
    return {
      account,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissionCodes: role.rolePermissions
          .map((rolePermission) => rolePermission.permission.code)
          .join(','),
      })),
      faculties,
    };
  }

  @Post(':id/role')
  @CmsAction(CmsPermission.ASSIGN_ROLE, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async assignRole(@Param('id') id: string, @Body() form: AssignRoleForm) {
    const user = await this.userBean.assignRole(id, form);
    return `Đã cập nhật vai trò và khoa của ${user.fullName}`;
  }
}
