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
import type { SubjectForm } from 'src/domain/forms';
import { MajorBean } from 'src/domain/major/major.bean';
import { SubjectBean } from 'src/domain/subject/subject.bean';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';

const LIST = '/cms/subjects';

@CmsController('cms/subjects')
export class SubjectController {
  constructor(
    private readonly subjectBean: SubjectBean,
    private readonly majorBean: MajorBean,
    private readonly facultyBean: FacultyBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_SUBJECT, 'subject/list')
  async showSubjectList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('facultyId') facultyIdParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const facultyId = Number(facultyIdParam) || undefined;
    const [{ subjects, total }, faculties, countByFaculty] = await Promise.all([
      this.subjectBean.search(keyword, facultyId, page),
      this.facultyBean.findAllWithMajorCount(),
      this.subjectBean.countByFaculty(),
    ]);
    return {
      subjects,
      total,
      keyword,
      page,
      facultyId,
      faculties: faculties.map((faculty) => ({
        ...faculty,
        subjectCount: countByFaculty.get(faculty.id) ?? 0,
      })),
    };
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

  @Post(':id/delete')
  @CmsAction(CmsPermission.UPDATE_SUBJECT, { to: LIST, onError: LIST })
  async deleteSubject(@Param('id', ParseIntPipe) id: number) {
    const subject = await this.subjectBean.remove(id);
    return `Đã xóa môn ${subject.title}`;
  }

  @Post(':id/toggle-status')
  @CmsAction(CmsPermission.UPDATE_SUBJECT, { to: LIST })
  async toggleSubjectStatus(@Param('id', ParseIntPipe) id: number) {
    const subject = await this.subjectBean.toggleStatus(id);
    return `Đã đổi trạng thái môn ${subject.title}`;
  }
}
