import api from './axiosInstance';

export const getTasks = async () => {
  const { data } = await api.get('/scheduler/tasks');
  return data;
};

export const createTask = async (payload) => {
  const { data } = await api.post('/scheduler/tasks', payload);
  return data;
};

export const updateTask = async (id, payload) => {
  const { data } = await api.put(`/scheduler/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id) => {
  const { data } = await api.delete(`/scheduler/tasks/${id}`);
  return data;
};

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
