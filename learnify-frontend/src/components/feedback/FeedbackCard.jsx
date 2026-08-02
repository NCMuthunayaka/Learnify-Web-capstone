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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0A1931] to-[#3b719f] text-white text-xs font-bold font-heading flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-[#0A1931]">{user_name || "Anonymous User"}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-body text-[11px] font-bold text-[#3b719f] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {subject || "General"}
              </span>
              <span className="font-body text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <StarRating rating={rating} size={14} />
          {sentiment && <SentimentBadge sentiment={sentiment} />}
        </div>
      </div>

      <p className="font-body text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200/60">
        "{comment}"
      </p>

      <div className="flex items-center justify-between font-body text-[10px] text-slate-400 font-medium pt-1">
        <span>Sent to System Admin</span>
        <span>{date}</span>
      </div>
    </div>
  )
}