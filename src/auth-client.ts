const AUTH_SERVICE_URL = 'https://auth.hole.icu';

export interface AuthUser {
    id: number;
    username: string;
    role: string;
    must_change_password?: boolean;
    session_token?: string;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    invite_code?: string;
}

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.error || 'auth service error') as Error & { status?: number };
        error.status = response.status;
        throw error;
    }

    return data;
}

export const authClient = {
    async register(request: RegisterRequest): Promise<AuthUser> {
        return authFetch<AuthUser>('/register', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    async login(request: LoginRequest): Promise<AuthUser> {
        return authFetch<AuthUser>('/login', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    async logout(token: string): Promise<{ ok: boolean }> {
        return authFetch<{ ok: boolean }>('/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
    },

    async validateToken(token: string): Promise<AuthUser | null> {
        try {
            const user = await authFetch<AuthUser>('/session', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            return user;
        } catch (error) {
            const err = error as Error & { status?: number };
            if (err.status === 401) {
                return null;
            }
            throw error;
        }
    },

    async changePassword(token: string, request: ChangePasswordRequest): Promise<{ message: string }> {
        return authFetch<{ message: string }>('/change-password', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(request),
        });
    },

    async listUsers(token: string): Promise<{ users: AuthUser[]; total: number }> {
        return authFetch<{ users: AuthUser[]; total: number }>('/admin/users', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
    },

    async getUser(token: string, userId: number): Promise<AuthUser> {
        return authFetch<AuthUser>(`/admin/users/${userId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
    },

    async setUserRole(token: string, userId: number, role: string): Promise<{ user_id: number; role: string }> {
        return authFetch<{ user_id: number; role: string }>(`/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ role }),
        });
    },

    async deleteUser(token: string, userId: number): Promise<{ ok: boolean }> {
        return authFetch<{ ok: boolean }>(`/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};