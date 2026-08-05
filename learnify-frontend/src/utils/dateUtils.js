export const formatDate = (date) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

export const formatTime = (date) =>
  new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));

export const isToday = (date) => new Date(date).toDateString() === new Date().toDateString();
