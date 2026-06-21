import api from './axios';

export const getProfile = (username) => api.get(`/users/${username}`);
export const updateMe = (data) => api.patch('/users/me', data);
export const getUserMatches = (username, params) => api.get(`/users/${username}/matches`, { params });
