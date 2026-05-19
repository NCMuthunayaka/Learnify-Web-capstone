import { Trash2, Edit2, Check } from "lucide-react"
import StarRating from "./StarRating"
import SentimentBadge from "./SentimentBadge"

const categoryIcons = {
  bug: "🐛",
  feature: "✨",
  improvement: "📈",
  other: "💬",
}

function FeedbackCard({
  feedback,
  onEdit = null,
  onDelete = null,
  isAdmin = false,
  onResolve = null,
}) {
  const categoryIcon = categoryIcons[feedback.category] || "💬"

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl">{categoryIcon}</span>
            <h3 className="text-lg font-bold text-slate-900">{feedback.title}</h3>
          </div>
          <p className="text-sm text-slate-500">
            By {feedback.user_name} • {new Date(feedback.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onEdit && !isAdmin && (
            <button
              onClick={() => onEdit(feedback)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
          )}
          {onDelete && !isAdmin && (
            <button
              onClick={() => onDelete(feedback.id)}
              className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-700">{feedback.content}</p>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Rating:</span>
          <StarRating rating={feedback.rating} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Sentiment:</span>
          <SentimentBadge
            sentiment={feedback.sentiment}
            confidence={feedback.sentiment_score}
          />
        </div>

        {feedback.is_resolved && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <Check size={16} />
            Resolved
          </div>
        )}
      </div>

      {/* Admin Response */}
      {feedback.admin_response && (
        <div className="space-y-2 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Admin Response:</p>
          <p className="text-sm text-blue-800">{feedback.admin_response}</p>
        </div>
      )}

      {/* Resolve Button (Admin Only) */}
      {isAdmin && !feedback.is_resolved && onResolve && (
        <button
          onClick={() => onResolve(feedback.id)}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
        >
          Mark as Resolved
        </button>
      )}
    </div>
  )
}

export default FeedbackCard
