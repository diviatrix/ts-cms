// Simple API helper for all HTTP requests with unified error handling
import { getAuthToken, setAuthToken } from './api-auth.js';

async function apiFetch(url, { method = 'GET', data, auth = true } = {}) {
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