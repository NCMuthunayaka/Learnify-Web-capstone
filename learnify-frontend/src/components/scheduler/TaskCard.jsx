import Badge from '../common/Badge';

const priorityTone = { High: 'red', Medium: 'yellow', Low: 'green' };

const TaskCard = ({ task, onToggle }) => (
  <article className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <label className="flex min-w-0 items-center gap-3">
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} className="h-4 w-4" />
      <span className={`truncate font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</span>
    </label>
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-sm text-slate-500">{task.dueDate}</span>
      <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
    </div>
  </article>
);

export default TaskCard;
