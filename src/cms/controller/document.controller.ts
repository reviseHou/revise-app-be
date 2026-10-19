import {
  Body,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DocumentBean } from 'src/domain/document/document.bean';
import { REVIEW_CRITERIA } from 'src/domain/document/document.criteria';
import { DocumentStatus } from 'src/domain/enums';
import type { RejectDocumentForm } from 'src/domain/forms';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../cms.permission';
import type { CmsRequest } from '../util/cms.helper';

const DETAIL = '/cms/documents/:id';

@CmsController('cms/documents')
export class DocumentController {
  constructor(private readonly documentBean: DocumentBean) {}

  @Get()
  @CmsView(CmsPermission.READ_DOCUMENT, 'document/list')
  async showDocumentList(
    @Query('status') statusParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
  ) {
    const status =
      Object.values(DocumentStatus).find((s) => s === statusParam) ??
      DocumentStatus.PENDING;
    const page = Math.max(1, pageParam);
    const { documents, total } = await this.documentBean.findByStatus(
      status,
      page,
    );
    return {
      status,
      documents,
      total,
      page,
      countByStatus: await this.documentBean.countByStatus(),
    };
  }

  @Get(':id')
  @CmsView(CmsPermission.READ_DOCUMENT, 'document/detail')
  async showDocument(@Param('id', ParseIntPipe) id: number) {
    return {
      document: await this.documentBean.findById(id),
      criteria: REVIEW_CRITERIA,
    };
  }

  @Post(':id/approve')
  @CmsAction(CmsPermission.REVIEW_DOCUMENT, { to: DETAIL })
  async approveDocument(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const document = await this.documentBean.approve(id, request.user);
    return `Đã duyệt tài liệu ${document.title}`;
  }

  @Post(':id/reject')
  @CmsAction(CmsPermission.REVIEW_DOCUMENT, { to: DETAIL })
  async rejectDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() form: RejectDocumentForm,
    @Req() request: CmsRequest,
  ) {
    const document = await this.documentBean.reject(id, request.user, form);
    return `Đã từ chối tài liệu ${document.title}`;
  }

  @Post(':id/hide')
  @CmsAction(CmsPermission.REVIEW_DOCUMENT, { to: DETAIL })
  async hideDocument(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const document = await this.documentBean.hide(id, request.user);
    return `Đã ẩn tài liệu ${document.title}`;
  }

  @Post(':id/show')
  @CmsAction(CmsPermission.REVIEW_DOCUMENT, { to: DETAIL })
  async showHiddenDocument(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    const document = await this.documentBean.show(id, request.user);
    return `Đã hiện lại tài liệu ${document.title}`;
  }
}
