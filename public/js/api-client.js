// Simple API helper for all HTTP requests with unified error handling
// and authentication helpers (formerly api-core.js, now api-client.js)
import { getAuthToken, setAuthToken } from './token-storage.js';
import { jwtDecode } from './jwt-decode.js';
import { updateNavMenu } from '../../nav/script.js';

async function apiFetch(url, { method = 'GET', data, auth = true } = {}) {
  // Always check token validity before sending
  const token = getAuthToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 <= Date.now();
      if (isExpired) {
        setAuthToken(null);
      }
    } catch (error) {
      setAuthToken(null);
    }
  }
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getAuthToken()) headers['Authorization'] = `Bearer ${getAuthToken()}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error occurred',
      errors: [error.message || 'Network error occurred']
    };
  }
  if (res.status === 401) {
    setAuthToken(null);
    alert('Session expired');
    return { success: false, message: 'Unauthorized', errors: ['401'] };
  }
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { ...json, success: res.ok };
}

export const RecordsAPI = {
  getAll: (params = {}) => apiFetch('/api/records' + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '')),
  getById: (id) => apiFetch(`/api/records/${id}`),
  create: (data) => apiFetch('/api/records', { method: 'POST', data }),
  update: (id, data) => apiFetch(`/api/records/${id}`, { method: 'PUT', data }),
  delete: (id) => apiFetch(`/api/records/${id}`, { method: 'DELETE' })
};

export const AdminAPI = {
  getUsers: () => apiFetch('/api/admin/users'),
  getUserProfile: (userId) => apiFetch(`/api/profile/${userId}`)
};

export const ProfileAPI = {
  get: () => apiFetch('/api/profile'),
  update: (profileData) => apiFetch('/api/profile', { method: 'POST', data: profileData }),
  updatePassword: (passwordData) => apiFetch('/api/profile/password/set', { method: 'POST', data: passwordData })
};

export const UtilityAPI = {
  // Add only if actually used in frontend
};

// --- Auth helpers and API ---
function isAuthenticated(messages) {
    const token = getAuthToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 <= Date.now();
        if (isExpired) {
            setAuthToken(null);
            if (messages) {
                console.warn('Your session has expired.');
            }
            return false;
        }
        return true;
    } catch (error) {
        setAuthToken(null);
        if (messages) {
            console.error('Error: ' + (error?.message || error?.toString()));
        }
        return false;
    }
}

function logout() {
    setAuthToken(null);
    document.dispatchEvent(new CustomEvent('navShouldUpdate'));
    if (typeof updateNavMenu === 'function') updateNavMenu();
    window.location.href = '/';
}

function getUserRole() {
    const token = getAuthToken();
    if (!token) return [];
    try {
        const decoded = jwtDecode(token);
        const roles = decoded.roles || decoded.groups || [];
        return roles;
    } catch (error) {
        return [];
    }
}

export const AuthAPI = {
    async login(login, password, messages) {
        const response = await apiFetch('/api/login', { method: 'POST', data: { login, password }, auth: false });
        if (response.success && response.data?.token) {
            setAuthToken(response.data.token);
            document.dispatchEvent(new CustomEvent('navShouldUpdate'));
            if (typeof updateNavMenu === 'function') updateNavMenu();
        } else if (messages && response.message) { console.error('Login failed:', response.message); }
        return response;
    },
    async register(login, email, password) {
        return apiFetch('/api/register', { method: 'POST', data: { login, email, password }, auth: false });
    },
    logout,
    isAuthenticated,
    getUserRole
};

export { isAuthenticated, logout, getUserRole, apiFetch };
