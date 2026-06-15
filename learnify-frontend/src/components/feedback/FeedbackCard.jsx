import StarRating from "./StarRating"
import SentimentBadge from "./SentimentBadge"

export default function FeedbackCard({ feedback }) {
  const { user_name, subject, category, comment, rating, sentiment, created_at } = feedback

  const initials = user_name
    ?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"

  const date = new Date(created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#4A7FA7] text-white text-xs font-bold font-heading
          flex items-center justify-center flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-body text-sm font-semibold text-[#0A1931]">{user_name}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} size={11} />
              <SentimentBadge sentiment={sentiment} />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-body text-[10px] text-[#4A7FA7] bg-[#EBF3F9] border border-[#D5E6F2]
              px-2 py-0.5 rounded-md font-semibold">
              {subject}
            </span>
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              {category}
            </span>
          </div>

          <p className="font-body text-sm text-gray-600 leading-relaxed">{comment}</p>
          <span className="font-body text-[10px] text-gray-300 font-semibold mt-2 block">{date}</span>
        </div>
      </div>
    </div>
  )
}