import { useMemo, useState, useEffect } from 'react';
import * as schedulerApi from '../api/schedulerApi';

export const useScheduler = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const response = await schedulerApi.getTasks();
        if (response.success) {
          setTasks(response.tasks);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const completedCount = useMemo(() => tasks.filter((task) => task.status === 'completed').length, [tasks]);

  const addTask = async (task) => {
    try {
      const response = await schedulerApi.createTask(task);
      if (response.success) {
        setTasks((current) => [...current, response.task]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to add task:', err);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const response = await schedulerApi.updateTask(id, { ...task, status: newStatus });
      if (response.success) {
        setTasks((current) => current.map((t) => (t.id === id ? response.task : t)));
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to update task:', err);
    }
  };

  return { tasks, addTask, toggleTask, completedCount, isLoading, error };
};
