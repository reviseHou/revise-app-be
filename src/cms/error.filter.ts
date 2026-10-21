import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  canEnterCms,
  CMS_SESSION_COOKIE,
} from 'src/domain/auth/auth.constants';
import {
  CmsRequest,
  GENERIC_ERROR_MESSAGE,
  withAlert,
} from './util/cms.helper';

const LOGIN_URL = '/cms/login';

@Catch()
export class CmsErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('CMS');

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<CmsRequest>();
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof UnauthorizedException) {
      return this.logOut(request, response, LOGIN_URL);
    }
    if (exception instanceof ForbiddenException) {
      return this.handleForbidden(request, response);
    }
    if (exception instanceof HttpException) {
      return this.showError(response, exception.getStatus(), exception.message);
    }
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return this.showError(response, 500, GENERIC_ERROR_MESSAGE);
  }

  private handleForbidden(request: CmsRequest, response: Response) {
    if (!canEnterCms(request.user)) {
      return this.logOut(
        request,
        response,
        withAlert(LOGIN_URL, { error: 'Tài khoản không có quyền vào CMS' }),
      );
    }
    return this.showError(response, 403, 'Forbidden');
  }

  private logOut(request: CmsRequest, response: Response, redirectUrl: string) {
    request.session.destroy(() => {
      response.clearCookie(CMS_SESSION_COOKIE);
      response.redirect(redirectUrl);
    });
  }

  private showError(response: Response, status: number, message: string) {
    return response.status(status).render('error', { status, message });
  }
}
