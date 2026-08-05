import { useState, useEffect } from 'react';
import * as chatApi from '../api/chatApi';

const starterMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hi! Ask me to explain a topic, create a study plan, or quiz you.',
    createdAt: new Date().toISOString(),
  },
];

export const useChat = () => {
  const [messages, setMessages] = useState(starterMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(1);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await chatApi.getConversations();
        if (response.success) {
          setConversations(response.conversations);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);

  const sendMessage = async (content) => {
    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content, 
      createdAt: new Date().toISOString() 
    };
    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatApi.sendChatMessage(content, activeConversationId);
      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.message?.content || 'Response received',
          createdAt: new Date().toISOString(),
        };
        setMessages((current) => [...current, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return { messages, isTyping, sendMessage, conversations, activeConversationId, setActiveConversationId };
};
