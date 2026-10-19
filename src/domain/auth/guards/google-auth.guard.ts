import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ query?: Record<string, unknown> }>();
    return request.query?.from === 'cms'
      ? { state: 'cms', prompt: 'select_account' }
      : {};
  }
}
