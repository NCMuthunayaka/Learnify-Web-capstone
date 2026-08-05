const UpcomingTasksWidget = ({ tasks = [] }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-bold text-slate-900">Upcoming Tasks</h2>
    <div className="space-y-3">
      {tasks.slice(0, 4).map((task) => (
        <div key={task.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-700">{task.title}</span>
          <span className="text-xs font-semibold text-slate-500">{task.dueDate}</span>
        </div>
      ))}
    </div>
  </div>
);

export default UpcomingTasksWidget;
