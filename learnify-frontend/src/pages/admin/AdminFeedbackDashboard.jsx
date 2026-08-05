import FeedbackCard from '../../components/feedback/FeedbackCard';

const feedback = [
  { id: 1, name: 'Admin View', category: 'App', rating: 5, message: 'Feedback summary is ready.', sentiment: 'positive' },
];

const AdminFeedbackDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Admin Feedback</h1>
    <div className="grid gap-4 md:grid-cols-2">
      {feedback.map((item) => (
        <FeedbackCard key={item.id} feedback={item} />
      ))}
    </div>
  </div>
);

export default AdminFeedbackDashboard;
