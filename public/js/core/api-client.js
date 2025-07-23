import { jwtDecode } from '../utils/jwt-decode.js';


export function getAuthToken() {
    return localStorage.getItem('token');
}

export function setAuthToken(token) {
    console.log('setAuthToken called with:', token ? 'token present' : 'null/empty');
    if (token) {
        localStorage.setItem('token', token);
    } else {
        console.log('Removing token from localStorage');
        localStorage.removeItem('token');
    }
    document.dispatchEvent(new CustomEvent('authChange'));
}


export async function apiFetch(url, { method = 'GET', data, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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
        setAuthToken(null);
        return { success: false, message: 'Session expired or invalid. Please log in again.', errors: ['401'] };
    }

    let json;
    try {
        json = await res.json();
    } catch {
        json = { success: res.ok, data: null, message: res.statusText };
    }

    return { ...json, success: res.ok };
}


export function isAuthenticated() {
    console.log('isAuthenticated() called');
    const token = getAuthToken();
    console.log('Token exists:', !!token);
    if (!token) return false;
    try {
        console.log('Attempting to decode token...');
        const payload = jwtDecode(token);
        console.log('Token decoded successfully, payload:', payload);
        // Check if payload has required fields
        if (!payload || typeof payload.exp !== 'number') {
            console.error('Invalid token payload structure');
            setAuthToken(null);
            return false;
        }
        const isValid = payload.exp * 1000 > Date.now();
        if (!isValid) {
            console.log('Token expired, removing from storage');
            setAuthToken(null);
        }
        return isValid;
    } catch (error) {
        console.error('Token validation error:', error);
        setAuthToken(null);
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
        console.error('Token decode error in getUserRoles:', error);
        setAuthToken(null);
        return [];
    }
}

export function logout() {
    setAuthToken(null);
    window.location.href = '/';
}



export const AuthAPI = {
    login: (login, password) => apiFetch('/api/login', { method: 'POST', data: { login, password }, auth: false }),
    register: (login, email, password) => apiFetch('/api/register', { method: 'POST', data: { login, email, password }, auth: false }),
    logout,
    isAuthenticated,
    getUserRoles
};

export const RecordsAPI = {
    getAll: async (params = {}) => {
        const response = await apiFetch('/api/records' + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''), { auth: false });
        // Reverse the order to show newest first
        if (response.success && Array.isArray(response.data)) {
            response.data.reverse();
        }
        return response;
    },
    getById: (id) => apiFetch(`/api/records/${id}`, { auth: false }),
    create: (data) => apiFetch('/api/records', { method: 'POST', data }),
    update: (id, data) => apiFetch(`/api/records/${id}`, { method: 'PUT', data }),
    delete: (id) => apiFetch(`/api/records/${id}`, { method: 'DELETE' })
};

export const ProfileAPI = {
    get: () => apiFetch('/api/profile'),
    update: (profileData) => apiFetch('/api/profile', { method: 'PUT', data: profileData }),
    adminUpdate: (userId, data) => apiFetch('/api/profile', { method: 'POST', data: { user_id: userId, ...data } }),
    changePassword: (newPassword) => apiFetch('/api/profile/password/set', { method: 'POST', data: { newPassword } })
};

export const AdminAPI = {
    getUsers: () => apiFetch('/api/admin/users'),
    getUserProfile: (userId) => apiFetch(`/api/profile/${userId}`)
};

export const ThemesAPI = {
    getAll: () => apiFetch('/api/themes', { auth: false }),
    getById: (id) => apiFetch(`/api/themes/${id}`, { auth: false }),
    getActive: () => apiFetch('/api/themes/active', { auth: false }),
    getSettings: (id) => apiFetch(`/api/themes/${id}/settings`, { auth: false }),
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
