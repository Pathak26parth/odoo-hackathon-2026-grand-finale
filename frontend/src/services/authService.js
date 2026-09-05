import api, { setStoredTokens, clearStoredTokens } from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      setStoredTokens(res.data.accessToken, res.data.refreshToken);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async refreshToken(refreshToken) {
    const res = await api.post('/auth/refresh', { refreshToken });
    if (res.success && res.data) {
      setStoredTokens(res.data.accessToken);
      return res.data;
    }
    throw new Error('Could not refresh session');
  },

  async logout() {
    const token = getStoredToken();
    clearStoredTokens();
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore network or auth errors on logout
      }
    }
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res;
  },

  async activateAccount(token, email, newPassword) {
    const res = await api.post('/auth/activate-account', { token, email, newPassword });
    return res;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res;
  },

  async resetPassword(token, email, newPassword) {
    const res = await api.post('/auth/reset-password', { token, email, newPassword });
    return res;
  }
};

export default authService;
