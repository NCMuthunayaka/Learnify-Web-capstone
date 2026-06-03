function LoadingSpinner({
  size = "md",
  color = "primary",
  fullScreen = false,
  label = "",
}) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  }

  const colors = {
    primary: "border-[#1A3D63] border-t-transparent",
    white:   "border-white border-t-transparent",
    accent:  "border-[#4A7FA7] border-t-transparent",
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`rounded-full animate-spin
        ${sizes[size]} ${colors[color]}`}
      />
      {label && (
        <p className="font-body text-sm text-gray-400">{label}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center
        justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner