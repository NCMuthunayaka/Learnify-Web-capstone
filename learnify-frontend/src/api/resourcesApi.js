import api from './axiosInstance';

export const getResources = async (params = {}) => {
  const { data } = await api.get('/resources', { params });
  return data;
};

export const saveResource = async (payload) => {
  const { data } = await api.post('/resources', payload);
  return data;
};

export default {
  getResources,
  saveResource,
};
