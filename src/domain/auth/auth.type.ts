export interface UserJwtPayload {
  email: string;
  sub: number;
  iat?: number;
  exp?: number;
}
