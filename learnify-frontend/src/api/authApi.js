import api from './axiosInstance';

export const authApi = {
  // Register a new user
  register: async (email, firstName, lastName, password, confirmPassword, role = 'student') => {
    try {
      const response = await api.post('/auth/register', {
        email,
        firstName,
        lastName,
        password,
        confirmPassword,
        role,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post(
        '/auth/refresh',
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || { error: 'Token refresh failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user' };
    }
  },

  // Logout (client-side only, clears tokens)
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export default authApi;
