const sentimentConfig = {
  positive: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    emoji: "😊",
    label: "Positive",
  },
  negative: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    emoji: "😞",
    label: "Negative",
  },
  neutral: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    emoji: "😐",
    label: "Neutral",
  },
}

function SentimentBadge({ sentiment = "neutral", confidence = 0 }) {
  const config = sentimentConfig[sentiment] || sentimentConfig.neutral

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${config.bg} ${config.border}`}>
      <span className="text-lg">{config.emoji}</span>
      <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
      {confidence > 0 && (
        <span className={`text-xs ${config.text}`}>({Math.round(confidence * 100)}%)</span>
      )}
    </div>
  )
}

export default SentimentBadge
