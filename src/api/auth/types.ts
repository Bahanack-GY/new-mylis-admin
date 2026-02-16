export type Role = 'MANAGER' | 'EMPLOYEE' | 'HEAD_OF_DEPARTMENT';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    role?: Role;
}

export interface AuthResponse {
    access_token: string;
    user: { id: string; email: string; role: Role; departmentId: string | null };
}

export interface UserProfile {
    userId: string;
    email: string;
    role: Role;
    departmentId: string | null;
}
