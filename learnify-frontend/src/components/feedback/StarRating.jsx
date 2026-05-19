import { useState } from "react"
import { Star } from "lucide-react"

function StarRating({ rating = 0, onRatingChange = null, size = "md" }) {
  const [hoverRating, setHoverRating] = useState(0)
  const isInteractive = onRatingChange !== null

  const sizeMap = {
    sm: { star: 16, gap: 2 },
    md: { star: 24, gap: 4 },
    lg: { star: 32, gap: 6 },
  }

  const config = sizeMap[size]

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={isInteractive ? "button" : "div"}
          onClick={() => isInteractive && onRatingChange(star)}
          onMouseEnter={() => isInteractive && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={!isInteractive}
          className={`transition-all ${isInteractive ? "cursor-pointer hover:scale-110" : ""}`}
        >
          <Star
            size={config.star}
            className={`${
              star <= (hoverRating || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-slate-600">
        {rating > 0 && `${rating}/5`}
      </span>
    </div>
  )
}

export default StarRating
