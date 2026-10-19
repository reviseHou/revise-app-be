import {
  applyDecorators,
  Controller,
  Redirect,
  Render,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Permissions } from 'src/domain/auth/decorator/permission.decorator';
import { PermissionsGuard } from 'src/domain/auth/guards/permissions.guard';
import { CmsSessionGuard } from './cms-session.guard';
import { CsrfGuard } from './csrf.guard';
import { CmsPermission } from './cms.permission';
import { CmsErrorFilter } from './error.filter';
import {
  FlashRedirectInterceptor,
  FlashRedirectOptions,
} from './flash-redirect.interceptor';

export function CmsController(path: string) {
  return applyDecorators(
    Controller(path),
    UseGuards(CmsSessionGuard, CsrfGuard, PermissionsGuard),
    UseFilters(CmsErrorFilter),
    ApiExcludeController(),
  );
}

export function CmsView(permission: CmsPermission, view: string) {
  return applyDecorators(Permissions(permission), Render(view));
}

export function CmsAction(
  permission: CmsPermission,
  options: FlashRedirectOptions,
) {
  return applyDecorators(
    Permissions(permission),
    Redirect(),
    UseInterceptors(new FlashRedirectInterceptor(options)),
  );
}
