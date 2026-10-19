import { Body, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import type { SubjectForm } from 'src/domain/forms';
import { MajorBean } from 'src/domain/major/major.bean';
import { SubjectBean } from 'src/domain/subject/subject.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../cms.permission';

const LIST = '/cms/subjects';

@CmsController('cms/subjects')
export class SubjectController {
  constructor(
    private readonly subjectBean: SubjectBean,
    private readonly majorBean: MajorBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_SUBJECT, 'subject/list')
  async showSubjectList() {
    return { subjects: await this.subjectBean.findAll() };
  }

  @Get('create')
  @CmsView(CmsPermission.CREATE_SUBJECT, 'subject/form')
  async showCreateForm() {
    return { majors: await this.majorBean.findAll() };
  }

  @Get(':id/edit')
  @CmsView(CmsPermission.UPDATE_SUBJECT, 'subject/form')
  async showEditForm(@Param('id', ParseIntPipe) id: number) {
    return {
      subject: await this.subjectBean.findById(id),
      majors: await this.majorBean.findAll(),
    };
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_SUBJECT, {
    to: LIST,
    onError: `${LIST}/create`,
  })
  async createSubject(@Body() form: SubjectForm) {
    const subject = await this.subjectBean.create(form);
    return `Đã tạo môn ${subject.title}`;
  }

  @Post(':id')
  @CmsAction(CmsPermission.UPDATE_SUBJECT, {
    to: LIST,
    onError: `${LIST}/:id/edit`,
  })
  async updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: SubjectForm,
  ) {
    const subject = await this.subjectBean.update(id, form);
    return `Đã cập nhật môn ${subject.title}`;
  }

  @Post(':id/toggle-status')
  @CmsAction(CmsPermission.UPDATE_SUBJECT, { to: LIST })
  async toggleSubjectStatus(@Param('id', ParseIntPipe) id: number) {
    const subject = await this.subjectBean.toggleStatus(id);
    return `Đã đổi trạng thái môn ${subject.title}`;
  }
}
