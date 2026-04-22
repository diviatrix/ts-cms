const AUTH_BASE = 'https://auth.hole.icu';

let requestBatcher = null;

export function getAuthToken() {
  return localStorage.getItem('session_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('session_token', token);
  } else {
    localStorage.removeItem('session_token');
  }
  document.dispatchEvent(new CustomEvent('authChange'));
}

export async function apiFetch(url, { method = 'GET', data, auth = true, batch = false } = {}) {
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
    return {
      success: false,
      message: error.message || 'A network error occurred.',
      errors: [error.message || 'Network error'],
      status: 'network_error'
    };
  }

  if (res.status === 401) {
    if (auth && !url.includes('/login') && !url.includes('/register')) {
      setAuthToken(null);
      return {
        success: false,
        message: 'Your session has expired. Please log in again.',
        errors: ['401'],
        status: 401
      };
    }
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

  if (!res.ok) {
    const errorMessages = {
      400: 'Invalid request data.',
      403: 'You do not have permission.',
      404: 'Resource not found.',
      500: 'Server error.'
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

export async function isAuthenticated() {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const res = await fetch(`${AUTH_BASE}/session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      setAuthToken(null);
      return false;
    }
    return true;
  } catch {
    setAuthToken(null);
    return false;
  }
}

export function getUserRoles() {
  const token = getAuthToken();
  if (!token) return [];
  try {
    const decoded = jwtDecode(token);
    return decoded.roles || decoded.group || [];
  } catch {
    return [];
  }
}

export async function logout() {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  }
  setAuthToken(null);
}

export const AuthAPI = {
  login: async (login, password) => {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (res.ok && data.session_token) {
      setAuthToken(data.session_token);
    }
    return { ...data, success: res.ok, status: res.status };
  },
  register: async (username, password) => {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return { ...(await res.json()), success: res.ok, status: res.status };
  },
  logout,
  isAuthenticated,
  getUserRoles
};

export const RecordsAPI = {
  getAll: async (params = {}, batch = false) => {
    const response = await apiFetch('/api/records' + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : ''), { auth: false, batch });
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
  })
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