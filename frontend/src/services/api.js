/**
 * PeoplePay360 Centralized REST API Client
 * Configured with environment base URL, automated JWT headers, and error formatting.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'peoplepay360_access_token';
const REFRESH_TOKEN_KEY = 'peoplepay360_refresh_token';

/**
 * Get stored authentication tokens
 */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Core Request Dispatcher
 */
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let browser set boundary automatically
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Handle Blob response (PDF / Binary)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      return await response.blob();
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (Array.isArray(data.errors) ? data.errors.map((e) => e.msg || e.message || e).join(', ') : '') ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;

      // Automatically handle token expiration / invalid token
      if (response.status === 401 && !cleanEndpoint.includes('/auth/login')) {
        // Trigger potential refresh or logout
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error('Cannot connect to backend server at ' + BASE_URL + '. Please verify the backend is running.');
      netErr.status = 503;
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  getBaseUrl: () => BASE_URL
};

export default api;
