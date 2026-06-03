function ProgressBar({
  value = 0,
  max = 100,
  color = "primary",
  size = "md",
  label = "",
  showPercent = false,
  animated = false,
}) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  const colors = {
    primary: "bg-[#1A3D63]",
    accent:  "bg-[#4A7FA7]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger:  "bg-red-500",
    purple:  "bg-purple-500",
  }

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }

  return (
    <div className="w-full space-y-1.5">

      {/* Label Row */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="font-body text-xs text-gray-500">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="font-body text-xs font-semibold
              text-[#1A3D63]">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}

      {/* Bar */}
      <div className={`w-full bg-gray-100 rounded-full
        overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full
            transition-all duration-500
            ${animated ? "animate-pulse" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>

    </div>
  )
}

export default ProgressBar