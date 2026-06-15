export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Safe checking for browser environment
const isBrowser = typeof window !== 'undefined';

export const getToken = (): string | null => {
  return isBrowser ? localStorage.getItem('church_auth_token') : null;
};

export const setToken = (token: string) => {
  if (isBrowser) localStorage.setItem('church_auth_token', token);
};

export const getUser = (): any | null => {
  if (!isBrowser) return null;
  const userStr = localStorage.getItem('church_auth_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const setUser = (user: any) => {
  if (isBrowser) localStorage.setItem('church_auth_user', JSON.stringify(user));
};

export const logout = () => {
  if (isBrowser) {
    localStorage.removeItem('church_auth_token');
    localStorage.removeItem('church_auth_user');
    window.location.href = '/login';
  }
};

// Generic fetch API wrapper
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized/expired token
  if (response.status === 401 || response.status === 403) {
    // Exclude login/register attempts from auto-logout
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
};
