import { Get } from '@nestjs/common';
import { DocumentBean } from 'src/domain/document/document.bean';
import { CmsPermission } from '../util/cms.permission';
import { CmsController, CmsView } from '../cms.decorator';

const MONTHS_SHOWN = 12;
const TOP_UPLOADERS_SHOWN = 5;

@CmsController('cms')
export class HomeController {
  constructor(private readonly documentBean: DocumentBean) {}

  @Get()
  @CmsView(CmsPermission.READ_STATISTICS, 'home')
  async showStatistics() {
    const monthsStart = new Date();
    monthsStart.setMonth(monthsStart.getMonth() - (MONTHS_SHOWN - 1), 1);
    monthsStart.setHours(0, 0, 0, 0);

    const [
      documentCountByStatus,
      documentCountByFaculty,
      documentCountByMonth,
      topUploaders,
    ] = await Promise.all([
      this.documentBean.countByStatus(),
      this.documentBean.countByFaculty(),
      this.documentBean.countByMonthSince(monthsStart),
      this.documentBean.findTopUploaders(TOP_UPLOADERS_SHOWN),
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
