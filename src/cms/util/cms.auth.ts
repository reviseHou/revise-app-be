import type { Request } from 'express';
import type { Users } from 'src/domain/user/entity/user.entity';
import { WEB_USER_ROLE } from 'src/constants';

export const CMS_SESSION_COOKIE = 'cms.sid';

const WEB_ONLY_ROLES = [WEB_USER_ROLE];

export function canEnterCms(user?: { role?: { code?: string } | null }) {
  const roleCode = user?.role?.code?.toUpperCase();
  return !!roleCode && !WEB_ONLY_ROLES.includes(roleCode);
}

const sessionStep = (step: (done: (error?: Error) => void) => void) =>
  new Promise<void>((resolve, reject) =>
    step((error) => (error ? reject(error) : resolve())),
  );

export async function startCmsSession(request: Request, user: Users) {
  if (!canEnterCms(user)) return false;
  await sessionStep((done) => request.session.regenerate(done));
  request.session.userId = user.id;
  await sessionStep((done) => request.session.save(done));
  return true;
}
