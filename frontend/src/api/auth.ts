import { apiClient, setAuthToken } from './client';
import { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username?: string;
  email: string;
  password: string;
  name: string;
  badgeNumber?: string;
  department?: string;
  requestedRole?: string;
}

/**
 * Backend returns { token: string, type: string }
 * User info must be decoded from the JWT payload.
 */
export interface LoginResponseData {
  token: string;
  tokenType: string;
  email: string;
  name: string;
  role: string;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponseData> {
  const response = await apiClient.post<LoginResponseData>('/api/auth/login', payload);
  if (response.data?.token) {
    setAuthToken(response.data.token);
  }
  return response.data;
}

/**
 * Backend returns UserResponse: { id, username, email, fullName, role, ... }
 * Register endpoint returns the created user directly (HTTP 201).
 */
export async function registerApi(payload: RegisterPayload): Promise<User> {
  const response = await apiClient.post<User>('/api/auth/register', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    badgeNumber: payload.badgeNumber,
    department: payload.department,
    requestedRole: payload.requestedRole,
  });
  return response.data;
}

export function logoutApi(): void {
  setAuthToken(null);
}
