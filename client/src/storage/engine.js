const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

let accessToken = null;

export const api = {
  setToken(token) {
    accessToken = token;
  },

  clearToken() {
    accessToken = null;
  },

  getToken() {
    return accessToken;
  },

  async request(method, path, body = null) {
    const headers = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const opts = { method, headers, credentials: 'include' };

    if (body !== null) {
      if (body instanceof FormData) {
        opts.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    let res = await fetch(`${API_BASE}${path}`, opts);

    // Auto-refresh on expired token
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await this.refresh();
        if (refreshed) {
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
          opts.headers = headers;
          res = await fetch(`${API_BASE}${path}`, opts);
        }
      }
      if (res.status === 401) {
        throw new Error(data.error || 'Unauthorized');
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  },

  async refresh() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      accessToken = data.accessToken;
      return true;
    } catch {
      return false;
    }
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },
};
