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
import type { CatalogForm } from 'src/domain/forms';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';

const LIST = '/cms/faculties';

@CmsController('cms/faculties')
export class FacultyController {
  constructor(private readonly facultyBean: FacultyBean) {}

  @Get()
  @CmsView(CmsPermission.READ_FACULTY, 'faculty/list')
  async showFacultyList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const { faculties, total } = await this.facultyBean.search(keyword, page);
    return { faculties, total, keyword, page };
  }

  @Get('create')
  @CmsView(CmsPermission.CREATE_FACULTY, 'faculty/form')
  showCreateForm() {
    return {};
  }

  @Get(':id/edit')
  @CmsView(CmsPermission.UPDATE_FACULTY, 'faculty/form')
  async showEditForm(@Param('id', ParseIntPipe) id: number) {
    return { faculty: await this.facultyBean.findById(id) };
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_FACULTY, {
    to: LIST,
    onError: `${LIST}/create`,
  })
  async createFaculty(@Body() form: CatalogForm) {
    const faculty = await this.facultyBean.create(form);
    return `Đã tạo khoa ${faculty.code}`;
  }

  @Post(':id')
  @CmsAction(CmsPermission.UPDATE_FACULTY, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async updateFaculty(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: CatalogForm,
  ) {
    const faculty = await this.facultyBean.update(id, form);
    return `Đã cập nhật khoa ${faculty.code}`;
  }

  @Post(':id/toggle-status')
  @CmsAction(CmsPermission.UPDATE_FACULTY, { to: LIST })
  async toggleFacultyStatus(@Param('id', ParseIntPipe) id: number) {
    const faculty = await this.facultyBean.toggleStatus(id);
    return `Đã đổi trạng thái khoa ${faculty.code}`;
  }
}
