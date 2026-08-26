import type { Permission } from './rbac.js';
import type { Role } from './rbac.js';
import type { IsoDateTime } from './common.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  permissions: Permission[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * The refresh token is **not** in this body — it is set by the API as an
 * httpOnly, SameSite cookie so that JavaScript (and therefore any XSS payload
 * running inside a micro frontend) cannot read it.
 */
export interface LoginResponse {
  accessToken: string;
  expiresAt: IsoDateTime;
  user: AuthenticatedUser;
}

export type RefreshResponse = LoginResponse;

export interface JwtAccessTokenClaims {
  sub: string;
  email: string;
  role: Role;
  permissions: Permission[];
  iat: number;
  exp: number;
}
