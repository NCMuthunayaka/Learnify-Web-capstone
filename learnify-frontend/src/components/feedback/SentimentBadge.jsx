const STYLES = {
  positive: "bg-green-50 text-green-700 border-green-200",
  neutral:  "bg-amber-50 text-amber-700 border-amber-200",
  negative: "bg-red-50   text-red-700   border-red-200",
}

export default function SentimentBadge({ sentiment }) {
  if (!sentiment) return null
  const style = STYLES[sentiment] ?? STYLES.neutral
  const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
  return (
    <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-md border ${style}`}>
      {label}
    </span>
  )
}