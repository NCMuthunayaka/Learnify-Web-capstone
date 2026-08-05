import { createSlice } from '@reduxjs/toolkit';

const schedulerSlice = createSlice({
  name: 'scheduler',
  initialState: { tasks: [] },
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    toggleTask: (state, action) => {
      const task = state.tasks.find((item) => item.id === action.payload);
      if (task) task.completed = !task.completed;
    },
  },
});

export const { setTasks, addTask, toggleTask } = schedulerSlice.actions;
export default schedulerSlice.reducer;
