import CategoryFilter from '../components/feedback/CategoryFilter';
import FeedbackCard from '../components/feedback/FeedbackCard';
import FeedbackForm from '../components/feedback/FeedbackForm';
import { useFeedback } from '../hooks/useFeedback';

const FeedbackPage = () => {
  const { items, category, setCategory, submitFeedback } = useFeedback();

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Feedback</h1>
        <FeedbackForm onSubmit={submitFeedback} />
      </div>
      <div className="space-y-4">
        <CategoryFilter value={category} onChange={setCategory} />
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
