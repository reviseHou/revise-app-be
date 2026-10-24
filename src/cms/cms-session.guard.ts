import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ActiveStatus } from 'src/domain/enums';
import { canEnterCms } from './util/cms.auth';
import { UsersService } from 'src/domain/user/users.service';
import type { CmsRequest } from './util/cms.helper';

@Injectable()
export class CmsSessionGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CmsRequest>();
    const userId = request.session.userId;
    if (!userId) throw new UnauthorizedException();

    const user = await this.usersService.findUserById(userId);
    if (!user || user.status !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException();
    }
    request.user = user;
    if (!canEnterCms(request.user)) throw new ForbiddenException();
    return true;
  }
}
