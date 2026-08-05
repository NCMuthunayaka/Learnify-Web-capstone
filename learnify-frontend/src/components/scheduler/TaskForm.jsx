import { useState } from 'react';
import Button from '../common/Button';

const TaskForm = ({ onSubmit }) => {
  const [task, setTask] = useState({ title: '', dueDate: '', priority: 'Medium' });

  const update = (key, value) => setTask((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!task.title.trim()) return;
    onSubmit(task);
    setTask({ title: '', dueDate: '', priority: 'Medium' });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_140px_auto]">
      <input className="rounded-md border border-slate-200 px-3 py-2" placeholder="Task title" value={task.title} onChange={(event) => update('title', event.target.value)} />
      <input className="rounded-md border border-slate-200 px-3 py-2" type="date" value={task.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
      <select className="rounded-md border border-slate-200 px-3 py-2" value={task.priority} onChange={(event) => update('priority', event.target.value)}>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
      <Button type="submit">Add</Button>
    </form>
  );
};

export default TaskForm;
