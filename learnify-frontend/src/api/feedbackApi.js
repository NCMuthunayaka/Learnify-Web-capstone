import api from './axiosInstance';

export const getFeedback = async (params = {}) => {
  const { data } = await api.get('/feedback', { params });
  return data;
};

export const createFeedback = async (payload) => {
  const { data } = await api.post('/feedback', payload);
  return data;
};

export const getFeedbackAnalytics = async () => {
  const { data } = await api.get('/admin/feedback/analytics');
  return data;
};

export default {
  getFeedback,
  createFeedback,
  getFeedbackAnalytics,
};
