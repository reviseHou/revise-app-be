import { HttpException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import type { Users } from 'src/domain/user/entity/user.entity';

export interface CmsRequest extends Request {
  user: Users;
}

export const GENERIC_ERROR_MESSAGE = 'Đã có lỗi xảy ra, vui lòng thử lại';

const logger = new Logger('CMS');

export function withAlert(
  url: string,
  alert: { success?: string; error?: string },
) {
  const key = alert.error ? 'error' : 'success';
  const message = alert.error ?? alert.success ?? '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(message)}`;
}

function readErrorMessage(exception: HttpException) {
  const body = exception.getResponse() as
    | string
    | { message?: string | string[] };
  const message = typeof body === 'string' ? body : body.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? exception.message;
}

export function toErrorMessage(error: unknown) {
  if (error instanceof HttpException) return readErrorMessage(error);
  logger.error(error instanceof Error ? error.stack : error);
  return GENERIC_ERROR_MESSAGE;
}
