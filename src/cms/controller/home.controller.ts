import { Get, Req } from '@nestjs/common';
import { DocumentBean } from 'src/domain/document/document.bean';
import { facultyScopeOf } from 'src/domain/faculty-scope';
import { CmsPermission } from '../util/cms.permission';
import { CmsController, CmsView } from '../cms.decorator';
import type { CmsRequest } from '../util/cms.helper';

const MONTHS_SHOWN = 12;
const TOP_UPLOADERS_SHOWN = 5;

@CmsController('cms')
export class HomeController {
  constructor(private readonly documentBean: DocumentBean) {}

  @Get()
  @CmsView(CmsPermission.READ_STATISTICS, 'home')
  async showStatistics(@Req() request: CmsRequest) {
    const scope = facultyScopeOf(request.user);
    const monthsStart = new Date();
    monthsStart.setMonth(monthsStart.getMonth() - (MONTHS_SHOWN - 1), 1);
    monthsStart.setHours(0, 0, 0, 0);

    const [
      documentCountByStatus,
      documentCountByFaculty,
      documentCountByMonth,
      topUploaders,
    ] = await Promise.all([
      this.documentBean.countByStatus(scope),
      this.documentBean.countByFaculty(scope),
      this.documentBean.countByMonthSince(monthsStart, scope),
      this.documentBean.findTopUploaders(TOP_UPLOADERS_SHOWN, scope),
    ]);

    const chartData = JSON.stringify({
      documentCountByStatus,
      documentCountByFaculty,
      documentCountByMonth,
      topUploaders,
    }).replace(/</g, '\\u003c');

    return { chartData };
  }
}
