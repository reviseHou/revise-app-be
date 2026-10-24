import {
  Body,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import type { RoleForm } from 'src/domain/forms';
import { PermissionBean } from 'src/domain/permission/permission.bean';
import { RoleBean } from 'src/domain/role/role.bean';
import { UserBean } from 'src/domain/user/user.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';

const LIST = '/cms/roles';

@CmsController('cms/roles')
export class RoleController {
  constructor(
    private readonly roleBean: RoleBean,
    private readonly permissionBean: PermissionBean,
    private readonly userBean: UserBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_ROLE, 'role/list')
  async showRoleList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const { roles, total } = await this.roleBean.search(keyword, page);
    return {
      roles,
      total,
      keyword,
      page,
      permissions: await this.permissionBean.findAll(),
      userCountByRole: await this.userBean.countByRole(),
    };
  }

  @Get('create')
  @CmsView(CmsPermission.CREATE_ROLE, 'role/form')
  showCreateForm() {
    return {};
  }

  @Get(':id/edit')
  @CmsView(CmsPermission.UPDATE_ROLE, 'role/form')
  async showEditForm(@Param('id', ParseIntPipe) id: number) {
    return { role: await this.roleBean.findById(id) };
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_ROLE, {
    to: LIST,
    onError: `${LIST}/create`,
  })
  async createRole(@Body() form: RoleForm) {
    const role = await this.roleBean.create(form);
    return `Đã tạo vai trò ${role.name}`;
  }

  @Post(':id')
  @CmsAction(CmsPermission.UPDATE_ROLE, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: RoleForm,
  ) {
    const role = await this.roleBean.update(id, form);
    return `Đã cập nhật vai trò ${role.name}`;
  }

  @Post(':id/permissions')
  @CmsAction(CmsPermission.UPDATE_ROLE, { to: LIST })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: RoleForm,
  ) {
    const role = await this.roleBean.assignPermissions(id, form);
    return `Đã lưu quyền của vai trò ${role.name}`;
  }

  @Post(':id/delete')
  @CmsAction(CmsPermission.DELETE_ROLE, { to: LIST })
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    const role = await this.roleBean.remove(id);
    return `Đã xóa vai trò ${role.name}`;
  }
}
