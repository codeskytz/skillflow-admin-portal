// Relative by default so requests go through the dev server's /api proxy
// (see vite.config.js) and stay same-origin — no CORS, and it keeps working
// when the app is opened from another device on the network, where
// "localhost" would point at that device rather than the API.
// Set VITE_API_URL to an absolute URL only when the API is on another host.
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function getToken() {
  return localStorage.getItem('sf_admin_token');
}

export function setToken(token) {
  localStorage.setItem('sf_admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('sf_admin_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('sf_admin_user') || 'null');
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem('sf_admin_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('sf_admin_user');
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const opts = { method, headers: { Accept: 'application/json', ...headers } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, opts);

  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) {
      clearToken();
      clearUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || (res.status === 403 ? 'Admin access required' : 'Request failed'));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldMessage = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(data.message || fieldMessage || 'Request failed');
  }
  return data;
}

export const api = {
  settings: () => request('/settings'),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
  admin: {
    stats: () => request('/admin/stats'),
    users: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
      ).toString();
      return request(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    toggleSuspend: (id) => request(`/admin/users/${id}/suspend`, { method: 'POST' }),
    toggleAdmin: (id) => request(`/admin/users/${id}/admin`, { method: 'POST' }),
    approveTeacher: (id) => request(`/admin/users/${id}/approve`, { method: 'POST' }),
    content: (type = 'all') => request(`/admin/content?type=${type}`),
    deleteNote: (id, payload = {}) => request(`/admin/content/notes/${id}`, { method: 'DELETE', body: payload }),
    deleteVideo: (id, payload = {}) => request(`/admin/content/videos/${id}`, { method: 'DELETE', body: payload }),
    deleteExam: (id, payload = {}) => request(`/admin/content/exams/${id}`, { method: 'DELETE', body: payload }),
    payments: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
      ).toString();
      return request(`/admin/payments${qs ? `?${qs}` : ''}`);
    },
    withdrawals: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
      ).toString();
      return request(`/admin/withdrawals${qs ? `?${qs}` : ''}`);
    },
    processWithdrawal: (id, payload = {}) => request(`/admin/withdrawals/${id}/process`, { method: 'POST', body: payload }),
    rejectWithdrawal: (id, payload = {}) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: payload }),
    levelRequests: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
      ).toString();
      return request(`/admin/level-requests${qs ? `?${qs}` : ''}`);
    },
    approveLevelRequest: (id, payload = {}) => request(`/admin/level-requests/${id}/approve`, { method: 'POST', body: payload }),
    rejectLevelRequest: (id, payload = {}) => request(`/admin/level-requests/${id}/reject`, { method: 'POST', body: payload }),
    levels: () => request('/admin/levels'),
    createLevel: (payload) => request('/admin/levels', { method: 'POST', body: payload }),
    updateLevel: (id, payload) => request(`/admin/levels/${id}`, { method: 'PUT', body: payload }),
    deleteLevel: (id) => request(`/admin/levels/${id}`, { method: 'DELETE' }),
    // Documents the Firestore import could not place. Read-only apart from
    // marking one reviewed — nothing from the snapshot can be deleted here.
    legacyArchive: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
      ).toString();
      return request(`/admin/legacy-archive${qs ? `?${qs}` : ''}`);
    },
    legacyArchiveSummary: () => request('/admin/legacy-archive/summary'),
    legacyArchiveEntry: (id) => request(`/admin/legacy-archive/${id}`),
    resolveLegacyArchive: (id, resolved = true) =>
      request(`/admin/legacy-archive/${id}/resolve`, { method: 'POST', body: { resolved } }),
    // Developer options: the external AI processor's address and secret,
    // changeable without a deploy.
    developerSettings: () => request('/admin/developer-settings'),
    updateDeveloperSettings: (payload) =>
      request('/admin/developer-settings', { method: 'PUT', body: payload }),
    testAiProcessor: () => request('/admin/developer-settings/test', { method: 'POST' }),
    tokenPackages: () => request('/admin/token-packages'),
    createTokenPackage: (payload) => request('/admin/token-packages', { method: 'POST', body: payload }),
    updateTokenPackage: (id, payload) => request(`/admin/token-packages/${id}`, { method: 'PUT', body: payload }),
    deleteTokenPackage: (id) => request(`/admin/token-packages/${id}`, { method: 'DELETE' }),
  },
};
