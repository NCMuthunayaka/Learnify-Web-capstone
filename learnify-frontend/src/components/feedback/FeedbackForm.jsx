import { useState } from 'react';
import Button from '../common/Button';
import StarRating from './StarRating';

const FeedbackForm = ({ onSubmit }) => {
  const [form, setForm] = useState({ name: '', category: 'Course', rating: 5, message: '' });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    onSubmit(form);
    setForm({ name: '', category: 'Course', rating: 5, message: '' });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input className="w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Your name" value={form.name} onChange={(event) => update('name', event.target.value)} />
      <select className="w-full rounded-md border border-slate-200 px-3 py-2" value={form.category} onChange={(event) => update('category', event.target.value)}>
        <option>Course</option>
        <option>App</option>
        <option>Support</option>
      </select>
      <StarRating value={form.rating} onChange={(rating) => update('rating', rating)} />
      <textarea className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Write feedback" value={form.message} onChange={(event) => update('message', event.target.value)} />
      <Button type="submit">Submit Feedback</Button>
    </form>
  );
};

export default FeedbackForm;
