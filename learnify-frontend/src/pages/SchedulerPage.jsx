import AssignmentList from '../components/scheduler/AssignmentList';
import CalendarView from '../components/scheduler/CalendarView';
import ProductivityMeter from '../components/scheduler/ProductivityMeter';
import SessionTimer from '../components/scheduler/SessionTimer';
import TaskForm from '../components/scheduler/TaskForm';
import { useScheduler } from '../hooks/useScheduler';

const SchedulerPage = () => {
  const { tasks, addTask, toggleTask, completedCount } = useScheduler();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scheduler</h1>
        <p className="text-slate-500">Plan assignments and study sessions.</p>
      </div>
      <TaskForm onSubmit={addTask} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <AssignmentList tasks={tasks} onToggle={toggleTask} />
        <div className="space-y-4">
          <SessionTimer />
          <ProductivityMeter completed={completedCount} total={tasks.length} />
          <CalendarView tasks={tasks} />
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;
