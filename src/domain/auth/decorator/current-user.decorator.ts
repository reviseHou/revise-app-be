import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Users } from 'src/domain/user/entity/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Users =>
    context.switchToHttp().getRequest<{ user: Users }>().user,
);
