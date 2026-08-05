import { useMemo, useState, useEffect } from 'react';
import * as feedbackApi from '../api/feedbackApi';

export const useFeedback = () => {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await feedbackApi.getFeedback();
        if (response.success) {
          setItems(response.feedback);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load feedback:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeedback();
  }, []);

  const filteredItems = useMemo(
    () => (category === 'All' ? items : items.filter((item) => item.category === category)),
    [category, items]
  );

  const submitFeedback = async (payload) => {
    try {
      const response = await feedbackApi.createFeedback(payload);
      if (response.success) {
        setItems((current) => [
          { 
            ...response.feedback, 
            sentiment: response.feedback.rating >= 4 ? 'positive' : 'neutral' 
          }, 
          ...current
        ]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to submit feedback:', err);
    }
  };

  return { items: filteredItems, category, setCategory, submitFeedback, isLoading, error };
};
