const HADRON_API = 'https://dev.hadronweb.com.br/app/AuthUsuarios/apiLogin';
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE = `https://${projectId}.supabase.co/functions/v1`;

let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const userStr = localStorage.getItem('hadron_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const email = user?.aus_email || user?.email;
      const oldToken = localStorage.getItem('hadron_token') || '';

      if (!email || !oldToken) {
        handleExpired();
        return null;
      }

      const res = await fetch(HADRON_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aus_email: email, aus_token: oldToken }),
      });

      if (!res.ok) {
        handleExpired();
        return null;
      }

      const data = await res.json();
      if (!data.success || !data.access_token) {
        handleExpired();
        return null;
      }

      localStorage.setItem('hadron_token', data.access_token);
      if (data.user) {
        localStorage.setItem('hadron_user', JSON.stringify(data.user));
      }
      return data.access_token;
    } catch {
      handleExpired();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function handleExpired() {
  localStorage.removeItem('hadron_token');
  localStorage.removeItem('hadron_user');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

/** Fetch with automatic 401 retry after token refresh */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('hadron_token');
  const headers = new Headers(options.headers);
  headers.set('apikey', anonKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}
