import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], isTyping: false },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
  },
});

export const { addMessage, setMessages, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
