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
import type { MajorForm } from 'src/domain/forms';
import { MajorBean } from 'src/domain/major/major.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../cms.permission';

const LIST = '/cms/majors';

@CmsController('cms/majors')
export class MajorController {
  constructor(
    private readonly majorBean: MajorBean,
    private readonly facultyBean: FacultyBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_MAJOR, 'major/list')
  async showMajorList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const { majors, total } = await this.majorBean.search(keyword, page);
    return { majors, total, keyword, page };
  }

  @Get('create')
  @CmsView(CmsPermission.CREATE_MAJOR, 'major/form')
  async showCreateForm() {
    return { faculties: await this.facultyBean.findAllWithMajorCount() };
  }

  @Get(':id/edit')
  @CmsView(CmsPermission.UPDATE_MAJOR, 'major/form')
  async showEditForm(@Param('id', ParseIntPipe) id: number) {
    return {
      major: await this.majorBean.findById(id),
      faculties: await this.facultyBean.findAllWithMajorCount(),
    };
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_MAJOR, {
    to: LIST,
    onError: `${LIST}/create`,
  })
  async createMajor(@Body() form: MajorForm) {
    const major = await this.majorBean.create(form);
    return `Đã tạo ngành ${major.code}`;
  }

  @Post(':id')
  @CmsAction(CmsPermission.UPDATE_MAJOR, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async updateMajor(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: MajorForm,
  ) {
    const major = await this.majorBean.update(id, form);
    return `Đã cập nhật ngành ${major.code}`;
  }

  @Post(':id/toggle-status')
  @CmsAction(CmsPermission.UPDATE_MAJOR, { to: LIST })
  async toggleMajorStatus(@Param('id', ParseIntPipe) id: number) {
    const major = await this.majorBean.toggleStatus(id);
    return `Đã đổi trạng thái ngành ${major.code}`;
  }
}
