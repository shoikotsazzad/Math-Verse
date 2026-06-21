import { create } from 'zustand';
import * as authApi from '../api/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('mv_token'),
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = localStorage.getItem('mv_token');
    if (!token) return set({ isLoading: false });
    try {
      const res = await authApi.getMe();
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('mv_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('mv_token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  register: async (username, email, password) => {
    const res = await authApi.register({ username, email, password });
    const { token, user } = res.data;
    localStorage.setItem('mv_token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('mv_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}));

export default useAuthStore;
