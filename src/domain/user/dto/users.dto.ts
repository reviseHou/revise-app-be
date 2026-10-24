export interface CreateUserInput {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  roleCode: string;
}
