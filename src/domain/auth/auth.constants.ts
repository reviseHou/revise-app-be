export const CMS_SESSION_COOKIE = 'cms.sid';

const STUDENT_ROLE = 'STUDENT';

export function canEnterCms(user?: { role?: { name?: string } | null }) {
  const roleName = user?.role?.name?.toUpperCase();
  return !!roleName && roleName !== STUDENT_ROLE;
}
