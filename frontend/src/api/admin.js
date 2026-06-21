import api from './axios';

export const adminGetUsers = (params) => api.get('/admin/users', { params });
export const adminBanUser = (id, ban) => api.patch(`/admin/users/${id}/ban`, { ban });
export const adminGetAnalytics = () => api.get('/admin/analytics');
export const adminGetReports = () => api.get('/admin/reports');
export const getQuestions = (params) => api.get('/questions', { params });
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.patch(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
