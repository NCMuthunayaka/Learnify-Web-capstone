export const calculateProgress = (completed = 0, total = 1) => {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
};

export const minutesToLabel = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
};
