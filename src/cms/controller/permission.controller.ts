import {
  Body,
  Get,
  Post,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import type { PermissionForm } from 'src/domain/forms';
import { PermissionBean } from 'src/domain/permission/permission.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';

const LIST = '/cms/permissions';

@CmsController('cms/permissions')
export class PermissionController {
  constructor(private readonly permissionBean: PermissionBean) {}

  @Get()
  @CmsView(CmsPermission.READ_PERMISSION, 'permission/list')
  async showPermissionList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const { permissions, total } = await this.permissionBean.search(
      keyword,
      page,
    );
    return { permissions, total, keyword, page };
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
