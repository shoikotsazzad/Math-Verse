import api from './axios';

export const getLeaderboard = (period = 'global', page = 1) =>
  api.get('/leaderboard', { params: { period, page } });
