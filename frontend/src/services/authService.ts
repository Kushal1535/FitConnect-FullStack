import { apiClient } from './apiClient';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await apiClient.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const user: User = {
      id: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
    };

    apiClient.setToken(res.token);
    apiClient.setCurrentUser(user);
    return { token: res.token, user };
  },

  logout(): void {
    apiClient.setToken(null);
    apiClient.setCurrentUser(null);
  },

  getCurrentUser(): User | null {
    return apiClient.getCurrentUser();
  },

  getToken(): string | null {
    return apiClient.getToken();
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken() && !!apiClient.getCurrentUser();
  },
};
