const StarRating = ({ value = 0, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange?.(star)}
        className={`text-xl ${star <= value ? 'text-amber-400' : 'text-slate-300'}`}
        aria-label={`${star} stars`}
      >
        ★
      </button>
    ))}
  </div>
);

export default StarRating;
