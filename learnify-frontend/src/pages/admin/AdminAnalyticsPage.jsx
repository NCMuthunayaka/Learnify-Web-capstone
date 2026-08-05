import StatsCard from '../../components/dashboard/StatsCard';

const AdminAnalyticsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Admin Analytics</h1>
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard title="Users" value="128" note="Registered learners" />
      <StatsCard title="Sessions" value="342" note="This month" />
      <StatsCard title="Feedback" value="94%" note="Positive sentiment" />
    </div>
  </div>
);

export default AdminAnalyticsPage;
