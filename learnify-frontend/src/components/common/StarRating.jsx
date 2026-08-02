import React, { useState } from "react"
import { Star } from "lucide-react"

function StarRating({
  rating = 0,
  count = 0,
  userRating = null,
  onRate,
  interactive = false,
  size = 15,
  showLabel = true,
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const activeRating = hoverRating || userRating || rating || 0

  const handleStarClick = (e, starValue) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRate) {
      onRate(starValue)
    }
  }

  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(activeRating)
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onClick={(e) => interactive && handleStarClick(e, star)}
              className={`p-0.5 rounded transition-transform ${
                interactive
                  ? "cursor-pointer hover:scale-115 text-amber-400"
                  : "cursor-default text-amber-400"
              }`}
              title={interactive ? `Rate ${star} star${star > 1 ? "s" : ""}` : `${rating} stars`}
            >
              <Star
                size={size}
                className={
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                    : "fill-slate-100 text-slate-300"
                }
              />
            </button>
          )
        })}
      </div>

      {showLabel && (
        <span className="font-body text-xs font-semibold text-slate-600 flex items-center gap-1">
          {rating > 0 ? Number(rating).toFixed(1) : "—"}
          {count > 0 && <span className="text-[10px] text-slate-400 font-normal">({count})</span>}
        </span>
      )}
    </div>
  )
}

export default StarRating
