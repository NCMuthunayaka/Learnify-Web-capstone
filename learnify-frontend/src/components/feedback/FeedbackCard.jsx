import SentimentBadge from './SentimentBadge';
import StarRating from './StarRating';

const FeedbackCard = ({ feedback }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h3 className="font-bold text-slate-900">{feedback.name}</h3>
        <p className="text-sm text-slate-500">{feedback.category}</p>
      </div>
      <SentimentBadge sentiment={feedback.sentiment} />
    </div>
    <StarRating value={feedback.rating} />
    <p className="mt-3 text-sm leading-6 text-slate-600">{feedback.message}</p>
  </article>
);

export default FeedbackCard;
