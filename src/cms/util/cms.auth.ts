import type { Request } from 'express';
import type { Users } from 'src/domain/user/entity/user.entity';
import { WEB_USER_ROLE } from 'src/constants';

export const CMS_SESSION_COOKIE = 'cms.sid';

const WEB_ONLY_ROLES = [WEB_USER_ROLE, 'STUDENT'];

export function canEnterCms(user?: { role?: { name?: string } | null }) {
  const roleName = user?.role?.name?.toUpperCase();
  return !!roleName && !WEB_ONLY_ROLES.includes(roleName);
}

export async function startCmsSession(request: Request, user: Users) {
  if (!canEnterCms(user)) return false;
  await new Promise<void>((resolve, reject) =>
    request.session.regenerate((error) => (error ? reject(error) : resolve())),
  );
  request.session.userId = user.id;
  await new Promise<void>((resolve, reject) =>
    request.session.save((error) => (error ? reject(error) : resolve())),
  );
  return true;
}
