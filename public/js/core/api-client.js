import { jwtDecode } from '../utils/jwt-decode.js';
import { requestBatcher } from '../utils/request-batcher.js';

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

export async function apiFetch(url, { method = 'GET', data, auth = true, batch = false } = {}) {
    // If batching is enabled, use the request batcher
    if (batch) {
        const batchKey = `${method}:${url}:${JSON.stringify(data)}`;
        return requestBatcher.add(batchKey, () => apiFetch(url, { method, data, auth, batch: false }));
    }

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
            message: error.message || 'A network error occurred. Please check your connection and try again.',
            errors: [error.message || 'Network error'],
            status: 'network_error'
        };
    }

    if (res.status === 401) {
        setAuthToken(null);
        return { 
            success: false, 
            message: 'Your session has expired. Please log in again.', 
            errors: ['401'],
            status: 401 
        };
    }

    let json;
    try {
        json = await res.json();
    } catch {
        json = { 
            success: res.ok, 
            data: null, 
            message: res.statusText || `Server returned status ${res.status}`
        };
    }

    // Enhance error messages with more descriptive information
    if (!res.ok) {
        const errorMessages = {
            400: 'Invalid request data. Please check your input and try again.',
            403: 'You do not have permission to perform this action.',
            404: 'The requested resource was not found.',
            500: 'An internal server error occurred. Please try again later.',
            502: 'Bad gateway. The server received an invalid response.',
            503: 'Service unavailable. Please try again later.'
        };
        
        const defaultMessage = json.message || `Server returned status ${res.status}`;
        const message = errorMessages[res.status] || defaultMessage;
        
        return {
            success: false,
            message,
            errors: json.errors || [message],
            status: res.status,
            data: json.data
        };
    }

    return { ...json, success: res.ok, status: res.status };
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
    register: (login, email, password, inviteCode) => apiFetch('/api/register', { method: 'POST', data: { login, email, password, inviteCode }, auth: false }),
    getRegistrationMode: () => apiFetch('/api/cms/registration-mode', { auth: false }),
    logout,
    isAuthenticated,
    getUserRoles
};

export const RecordsAPI = {
    getAll: async (params = {}, batch = false) => {
        const response = await apiFetch('/api/records' + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''), { auth: false, batch });
        // Reverse the order to show newest first
        if (response.success && Array.isArray(response.data)) {
            response.data.reverse();
        }
        return response;
    },
    getById: (id, batch = false) => apiFetch(`/api/records/${id}`, { auth: false, batch }),
    create: (data) => apiFetch('/api/records', { method: 'POST', data }),
    update: (id, data) => apiFetch(`/api/records/${id}`, { method: 'PUT', data }),
    delete: (id) => apiFetch(`/api/records/${id}`, { method: 'DELETE' })
};

export const ProfileAPI = {
    get: (batch = false) => apiFetch('/api/profile', { batch }),
    update: (profileData) => apiFetch('/api/profile', { method: 'PUT', data: profileData }),
    adminUpdate: (userId, data) => apiFetch('/api/profile', { method: 'POST', data: { user_id: userId, ...data } }),
    changePassword: (newPassword) => apiFetch('/api/profile/password/set', { method: 'POST', data: { newPassword } })
};

export const AdminAPI = {
    getUsers: (batch = false) => apiFetch('/api/admin/users', { batch }),
    getUserProfile: (userId, batch = false) => apiFetch(`/api/profile/${userId}`, { batch }),
    updateUserStatus: (userId, isActive) => apiFetch(`/api/admin/users/${userId}/status`, { 
        method: 'PUT', 
        data: { is_active: isActive } 
    }),
    
    // Invite management
    createInvite: () => apiFetch('/api/admin/invites', { method: 'POST' }),
    getInvites: (batch = false) => apiFetch('/api/admin/invites', { batch }),
    deleteInvite: (inviteId) => apiFetch(`/api/admin/invites/${inviteId}`, { method: 'DELETE' })
};

export const ThemesAPI = {
    getAll: (batch = false) => apiFetch('/api/themes', { auth: false, batch }),
    getById: (id, batch = false) => apiFetch(`/api/themes/${id}`, { auth: false, batch }),
    getActive: (batch = false) => apiFetch('/api/themes/active', { auth: false, batch }),
    getSettings: (id, batch = false) => apiFetch(`/api/themes/${id}/settings`, { auth: false, batch }),
    create: (data) => apiFetch('/api/themes', { method: 'POST', data }),
    update: (id, data) => apiFetch(`/api/themes/${id}`, { method: 'PUT', data }),
    delete: (id) => apiFetch(`/api/themes/${id}`, { method: 'DELETE' }),
    setActive: (themeId) => apiFetch('/api/cms/active-theme', { method: 'PUT', data: { theme_id: themeId } })
};

export const CmsSettingsAPI = {
    getAll: (batch = false) => apiFetch('/api/cms/settings', { batch }),
    getByKey: (key, batch = false) => apiFetch(`/api/cms/settings/${key}`, { batch }),
    update: (key, value, type) => apiFetch(`/api/cms/settings/${key}`, { method: 'PUT', data: { value, type } })
};
