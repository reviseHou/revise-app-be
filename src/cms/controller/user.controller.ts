import {
  Body,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import type { AssignRoleForm } from 'src/domain/forms';
import { RoleBean } from 'src/domain/role/role.bean';
import { UserBean } from 'src/domain/user/user.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../cms.permission';

const LIST = '/cms/users';

@CmsController('cms/users')
export class UserController {
  constructor(
    private readonly userBean: UserBean,
    private readonly roleBean: RoleBean,
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
  async showEditForm(@Param('id', ParseIntPipe) id: number) {
    return {
      account: await this.userBean.findById(id),
      roles: await this.roleBean.findAll(),
    };
  }

  @Post(':id/role')
  @CmsAction(CmsPermission.ASSIGN_ROLE, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: AssignRoleForm,
  ) {
    const user = await this.userBean.assignRole(id, form);
    return `Đã cập nhật vai trò của ${user.username}`;
  }
}
