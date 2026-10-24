export interface CatalogForm {
  code?: string;
  name?: string;
  description?: string;
}

export interface MajorForm extends CatalogForm {
  facultyId?: string;
}

export interface SubjectForm extends CatalogForm {
  majorId?: string;
  credit?: string;
}

export interface AssignRoleForm {
  facultyId?: string;
  roleId?: string;
}

export interface RejectDocumentForm {
  criteria?: string | string[];
  note?: string;
}

export interface RoleForm extends CatalogForm {
  permissionIds?: string | string[];
}

export type PermissionForm = CatalogForm;

export const listOf = (value?: string | string[]) => [value ?? []].flat();
