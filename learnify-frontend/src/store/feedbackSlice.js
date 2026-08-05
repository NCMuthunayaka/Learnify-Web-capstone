import { createSlice } from '@reduxjs/toolkit';

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: { items: [] },
  reducers: {
    setFeedback: (state, action) => {
      state.items = action.payload;
    },
    addFeedback: (state, action) => {
      state.items.unshift(action.payload);
    },
  },
});

export const { setFeedback, addFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
