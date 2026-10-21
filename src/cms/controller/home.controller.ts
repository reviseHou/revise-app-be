import { Get } from '@nestjs/common';
import { DocumentBean } from 'src/domain/document/document.bean';
import { DocumentStatus } from 'src/domain/enums';
import { CmsPermission } from '../util/cms.permission';
import { UserBean } from 'src/domain/user/user.bean';
import { CmsController, CmsView } from '../cms.decorator';

const OVERDUE_REVIEW_DAYS = 3;
const MONTHS_SHOWN = 12;
const TOP_UPLOADERS_SHOWN = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@CmsController('cms')
export class HomeController {
  constructor(
    private readonly userBean: UserBean,
    private readonly documentBean: DocumentBean,
  ) {}

  @Get()
  @CmsView(CmsPermission.READ_STATISTICS, 'home')
  async showStatistics() {
    const overdueBefore = new Date(
      Date.now() - OVERDUE_REVIEW_DAYS * MILLISECONDS_PER_DAY,
    );
    const monthsStart = new Date();
    monthsStart.setMonth(monthsStart.getMonth() - (MONTHS_SHOWN - 1), 1);
    monthsStart.setHours(0, 0, 0, 0);

    const [
      userCount,
      documentCount,
      overdueDocumentCount,
      documentCountByStatus,
      documentCountByFaculty,
      documentCountByMonth,
      topUploaders,
    ] = await Promise.all([
      this.userBean.count(),
      this.documentBean.count(),
      this.documentBean.countPendingBefore(overdueBefore),
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

    return {
      overdueDays: OVERDUE_REVIEW_DAYS,
      userCount,
      documentCount,
      pendingDocumentCount: documentCountByStatus[DocumentStatus.PENDING],
      overdueDocumentCount,
      chartData,
    };
  }
}
