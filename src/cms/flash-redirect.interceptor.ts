import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { catchError, map, of } from 'rxjs';
import { CmsRequest, toErrorMessage } from './util/cms.helper';

export interface FlashRedirectOptions {
  to: string;
  onError?: string;
}

export class FlashRedirectInterceptor implements NestInterceptor {
  constructor(private readonly options: FlashRedirectOptions) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<CmsRequest>();
    const fill = (url: string) =>
      url.replace(/:(\w+)/g, (param, name: string) =>
        String(request.params[name] ?? param),
      );
    const to = fill(this.options.to);
    const errorUrl = fill(this.options.onError ?? this.options.to);

    return next.handle().pipe(
      map((message: string) => {
        request.session.info = { type: 'success', content: message };
        return { url: to };
      }),
      catchError((error) => {
        request.session.info = {
          type: 'error',
          content: toErrorMessage(error),
        };
        return of({ url: errorUrl });
      }),
    );
  }
}
