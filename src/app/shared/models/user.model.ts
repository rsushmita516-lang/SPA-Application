export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'General User';
  status: 'Active' | 'Inactive';
  isDeleted?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
  serverDurationMs?: number;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: User | null;
  csrfToken: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
  selectedRole: 'Admin' | 'General User';
}

export interface LoginResponse {
  success: boolean;
  user: User;
  csrfToken: string;
}

export interface CreateUserPayload {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'General User';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'Admin' | 'General User';
  status?: 'Active' | 'Inactive';
}
