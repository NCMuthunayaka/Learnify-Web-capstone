import api from './axiosInstance';

export const sendChatMessage = async (message, conversationId) => {
  const { data } = await api.post('/chat/messages', { message, conversation_id: conversationId });
  return data;
};

export const getConversations = async () => {
  const { data } = await api.get('/chat/conversations');
  return data;
};

export const getConversationMessages = async (conversationId) => {
  const { data } = await api.get(`/chat/conversations/${conversationId}`);
  return data;
};

export default {
  sendChatMessage,
  getConversations,
  getConversationMessages,
};
