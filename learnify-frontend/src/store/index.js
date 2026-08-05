import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import feedbackReducer from './feedbackSlice';
import schedulerReducer from './schedulerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    feedback: feedbackReducer,
    scheduler: schedulerReducer,
  },
});
