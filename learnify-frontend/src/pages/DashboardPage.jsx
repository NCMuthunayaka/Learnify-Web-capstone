import AIInsightsWidget from '../components/dashboard/AIInsightsWidget';
import ProductivityWidget from '../components/dashboard/ProductivityWidget';
import StatsCard from '../components/dashboard/StatsCard';
import UpcomingTasksWidget from '../components/dashboard/UpcomingTasksWidget';
import { useScheduler } from '../hooks/useScheduler';

const DashboardPage = () => {
  const { tasks, completedCount } = useScheduler();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Track your learning progress at a glance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Tasks" value={tasks.length} note="Active assignments" />
        <StatsCard title="Completed" value={completedCount} note="Finished tasks" />
        <StatsCard title="Study Streak" value="7" note="Days in a row" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingTasksWidget tasks={tasks} />
        </div>
        <ProductivityWidget value={70} />
      </div>
      <AIInsightsWidget />
    </div>
  );
};

export default DashboardPage;
