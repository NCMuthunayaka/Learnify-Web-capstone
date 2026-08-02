import { Star } from "lucide-react"

export default function StarRating({ rating, onChange, size = 20 }) {
  const ratingLabels = ["", "Poor 😞", "Fair 😐", "Good 🙂", "Very Good 😀", "Excellent! 🌟"]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={`transition-transform duration-150 border-none bg-transparent ${
              onChange ? "cursor-pointer hover:scale-125" : "cursor-default pointer-events-none"
            }`}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                n <= rating
                  ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                  : "text-slate-300 fill-slate-200"
              }`}
            />
          </button>
        ))}
      </div>
      {onChange && rating > 0 && (
        <span className="font-body text-xs font-bold text-[#3b719f] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {ratingLabels[rating]}
        </span>
      )}
    </div>
  )
}