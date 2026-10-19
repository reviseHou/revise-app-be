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
}

export interface AssignRoleForm {
  roleId?: string;
}

export interface RejectDocumentForm {
  criteria?: string[];
  note?: string;
}

export interface RoleForm {
  name?: string;
  permissionIds?: string[];
}

export interface PermissionForm {
  name?: string;
}
