// Unified API client for all frontend-to-backend communication.
import { jwtDecode } from '../utils/jwt-decode.js';

// --- Authentication Token Management ---

export function getAuthToken() {
    return localStorage.getItem('token');
}

export function setAuthToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
    // Notify other parts of the application that authentication state has changed.
    document.dispatchEvent(new CustomEvent('authChange'));
}

// --- Core API Fetch Function ---

export async function apiFetch(url, { method = 'GET', data, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            // If auth is required and there's no token, fail early.
            return { success: false, message: 'Authentication required.', errors: ['401'] };
        }
    }

    let res;
    try {
        res = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
    } catch (error) {
        console.error('Network Error:', error);
        return {
            success: false,
            message: error.message || 'A network error occurred.',
            errors: [error.message || 'Network error']
        };
    }

    if (res.status === 401) {
        setAuthToken(null); // Clear expired/invalid token
        return { success: false, message: 'Session expired or invalid. Please log in again.', errors: ['401'] };
    }

    let json;
    try {
        json = await res.json();
    } catch {
        // Handle cases where the response is not JSON (e.g., 204 No Content)
        json = { success: res.ok, data: null, message: res.statusText };
    }

    return { ...json, success: res.ok };
}

// --- Authentication Helpers ---

export function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    try {
        const payload = jwtDecode(token);
        return payload.exp * 1000 > Date.now();
    } catch (error) {
        console.error('Token validation error:', error);
        setAuthToken(null); // Clear corrupted token
        return false;
    }
}

export function getUserRoles() {
    const token = getAuthToken();
    if (!token) return [];
    try {
        const decoded = jwtDecode(token);
        return decoded.roles || decoded.groups || [];
    } catch (error) {
        return [];
    }
}

export function logout() {
    setAuthToken(null);
    window.location.href = '/';
}


// --- API Endpoints ---

export const AuthAPI = {
    login: (login, password) => apiFetch('/api/login', { method: 'POST', data: { login, password }, auth: false }),
    register: (login, email, password) => apiFetch('/api/register', { method: 'POST', data: { login, email, password }, auth: false }),
    logout,
    isAuthenticated,
    getUserRoles
};

export const RecordsAPI = {
    getAll: (params = {}) => apiFetch('/api/records' + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '')),
    getById: (id) => apiFetch(`/api/records/${id}`),
    create: (data) => apiFetch('/api/records', { method: 'POST', data }),
    update: (id, data) => apiFetch(`/api/records/${id}`, { method: 'PUT', data }),
    delete: (id) => apiFetch(`/api/records/${id}`, { method: 'DELETE' })
};

export const ProfileAPI = {
    get: () => apiFetch('/api/profile'),
    update: (profileData) => apiFetch('/api/profile', { method: 'PUT', data: profileData }),
    // Admin-only update for another user's profile
    adminUpdate: (userId, data) => apiFetch('/api/profile', { method: 'POST', data: { user_id: userId, ...data } })
};

export const AdminAPI = {
    getUsers: () => apiFetch('/api/admin/users'),
    getUserProfile: (userId) => apiFetch(`/api/profile/${userId}`)
};

export const ThemesAPI = {
    getAll: () => apiFetch('/api/themes'),
    getById: (id) => apiFetch(`/api/themes/${id}`),
    getActive: () => apiFetch('/api/themes/active'),
    getSettings: (id) => apiFetch(`/api/themes/${id}/settings`),
    create: (data) => apiFetch('/api/themes', { method: 'POST', data }),
    update: (id, data) => apiFetch(`/api/themes/${id}`, { method: 'PUT', data }),
    delete: (id) => apiFetch(`/api/themes/${id}`, { method: 'DELETE' }),
    setActive: (themeId) => apiFetch('/api/cms/active-theme', { method: 'PUT', data: { theme_id: themeId } })
};

export const CmsSettingsAPI = {
    getAll: () => apiFetch('/api/cms/settings'),
    getByKey: (key) => apiFetch(`/api/cms/settings/${key}`),
    update: (key, value, type) => apiFetch(`/api/cms/settings/${key}`, { method: 'PUT', data: { value, type } })
};
