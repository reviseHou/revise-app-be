import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { canEnterCms } from './util/cms.auth';
import { UsersService } from 'src/domain/user/users.service';
import type { CmsRequest } from './util/cms.helper';

@Injectable()
export class CmsSessionGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CmsRequest>();
    const userId = request.session?.userId;
    if (!userId) throw new UnauthorizedException();

    try {
      request.user = await this.usersService.findUserById(userId);
    } catch (error) {
      if (error instanceof NotFoundException) throw new UnauthorizedException();
      throw error;
    }
    if (!canEnterCms(request.user)) throw new ForbiddenException();
    return true;
  }
}
