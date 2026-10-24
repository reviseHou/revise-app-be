export interface UserJwtPayload {
  email: string;
  sub: string;
  iat?: number;
  exp?: number;
}

export interface GoogleUser {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
}
