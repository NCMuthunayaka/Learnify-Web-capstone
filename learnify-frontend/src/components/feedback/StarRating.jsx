import { Star } from "lucide-react"

export default function StarRating({ rating, onChange, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default pointer-events-none"}
        >
          <Star
            size={size}
            className={n <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"}
          />
        </button>
      ))}
    </div>
  )
}