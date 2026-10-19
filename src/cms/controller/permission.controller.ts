import { Body, Get, Post } from '@nestjs/common';
import type { PermissionForm } from 'src/domain/forms';
import { PermissionBean } from 'src/domain/permission/permission.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../cms.permission';

const LIST = '/cms/permissions';

@CmsController('cms/permissions')
export class PermissionController {
  constructor(private readonly permissionBean: PermissionBean) {}

  @Get()
  @CmsView(CmsPermission.READ_PERMISSION, 'permission/list')
  async showPermissionList() {
    return { permissions: await this.permissionBean.findAll() };
  }

  @Get('create')
  @CmsView(CmsPermission.CREATE_PERMISSION, 'permission/form')
  showCreateForm() {
    return {};
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_PERMISSION, {
    to: LIST,
    onError: `${LIST}/create`,
  })
  async createPermission(@Body() form: PermissionForm) {
    const permission = await this.permissionBean.create(form);
    return `Đã tạo quyền ${permission.name}`;
  }
}
