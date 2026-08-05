const CalendarView = ({ tasks = [] }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-bold text-slate-900">Calendar</h2>
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span>{task.title}</span>
          <span className="font-semibold text-slate-500">{task.dueDate || 'No date'}</span>
        </div>
      ))}
    </div>
  </div>
);

export default CalendarView;
