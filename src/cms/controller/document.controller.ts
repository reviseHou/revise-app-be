import {
  Body,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  DefaultValuePipe,
} from '@nestjs/common';
import { DocumentBean } from 'src/domain/document/document.bean';
import { REVIEW_CRITERIA } from 'src/domain/document/document.criteria';
import { DocumentStatus } from 'src/domain/enums';
import { facultyScopeOf } from 'src/domain/faculty-scope';
import type { RejectDocumentForm } from 'src/domain/forms';
import { CmsAction, CmsController, CmsView } from '../cms.decorator';
import { CmsPermission } from '../util/cms.permission';
import type { CmsRequest } from '../util/cms.helper';

const DETAIL = '/cms/documents/:id';

const ALL_STATUS = 'ALL';

@CmsController('cms/documents')
export class DocumentController {
  constructor(private readonly documentBean: DocumentBean) {}

  @Get()
  @CmsView(CmsPermission.READ_DOCUMENT, 'document/list')
  async showDocumentList(
    @Query('keyword') keywordParam: string | undefined,
    @Query('status') statusParam: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) pageParam: number,
    @Req() request: CmsRequest,
  ) {
    const scope = facultyScopeOf(request.user);
    const keyword = (keywordParam ?? '').trim();
    const page = Math.max(1, pageParam);
    const status =
      statusParam === ALL_STATUS
        ? undefined
        : (Object.values(DocumentStatus).find((s) => s === statusParam) ??
          DocumentStatus.PENDING);
    const { documents, total } = await this.documentBean.search(
      keyword,
      status,
      page,
      scope,
    );
    const countByStatus = await this.documentBean.countByStatus(scope);
    return {
      status: status ?? ALL_STATUS,
      keyword,
      documents,
      total,
      page,
      countByStatus,
      countAll: Object.values(countByStatus).reduce((a, b) => a + b, 0),
    };
  }

  @Get(':id')
  @CmsView(CmsPermission.READ_DOCUMENT, 'document/detail')
  async showDocument(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CmsRequest,
  ) {
    return {
      document: await this.documentBean.findById(
        id,
        facultyScopeOf(request.user),
      ),
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
