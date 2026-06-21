import api from './axios';

export const getTournaments = () => api.get('/tournaments');
export const getTournament = (id) => api.get(`/tournaments/${id}`);
export const registerForTournament = (id) => api.post(`/tournaments/${id}/register`);
export const createTournament = (data) => api.post('/tournaments', data);
export const startTournament = (id) => api.post(`/tournaments/${id}/start`);
