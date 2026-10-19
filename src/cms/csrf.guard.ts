import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { isRequestValid } from './util/csrf';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export class CsrfException extends ForbiddenException {}

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.includes(request.method) || isRequestValid(request)) {
      return true;
    }
    throw new CsrfException(
      'Phiên làm việc không hợp lệ, vui lòng tải lại trang',
    );
  }
}
