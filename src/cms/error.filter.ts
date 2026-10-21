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
import { canEnterCms } from './util/cms.auth';
import { CmsRequest, GENERIC_ERROR_MESSAGE } from './util/cms.helper';

const LOGIN_URL = '/cms/login';

@Catch()
export class CmsErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('CMS');

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<CmsRequest>();
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof UnauthorizedException) {
      return this.logOut(request, response);
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
      return this.logOut(request, response, 'Tài khoản không có quyền vào CMS');
    }
    return this.showError(response, 403, 'Forbidden');
  }

  private logOut(request: CmsRequest, response: Response, error?: string) {
    request.session.regenerate(() => {
      if (error) request.session.info = { type: 'error', content: error };
      response.redirect(LOGIN_URL);
    });
  }

  private showError(response: Response, status: number, message: string) {
    return response.status(status).render('error', { status, message });
  }
}
