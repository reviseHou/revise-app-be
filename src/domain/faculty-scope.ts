import { ForbiddenException } from '@nestjs/common';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { Users } from './user/entity/user.entity';

export type FacultyScope = number | null;

export const facultyScopeOf = (user: Users): FacultyScope =>
  user.faculty?.id ?? null;

export function applyFacultyScope<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  scope: FacultyScope,
  facultyIdColumn: string,
) {
  if (scope === null) return query;
  return query.andWhere(`${facultyIdColumn} = :scopeFacultyId`, {
    scopeFacultyId: scope,
  });
}

export function assertInFacultyScope(
  scope: FacultyScope,
  facultyId?: number | null,
) {
  if (scope !== null && facultyId !== scope) {
    throw new ForbiddenException('Nội dung này không thuộc khoa của bạn');
  }
}
