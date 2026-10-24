import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Users } from '../../user/entity/user.entity';
import { permissionCodesOf } from '../../user/users.service';
import { PERMISSIONS_KEY } from '../decorator/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: Users }>();
    const permissions = permissionCodesOf(user);

    const hasPermission = requiredPermissions.some((perm) =>
      permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Required: [${requiredPermissions.join(', ')}] — user has: [${permissions.join(', ')}]`,
      );
    }

    return true;
  }
}
