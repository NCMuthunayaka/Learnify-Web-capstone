function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
}) {
  const variants = {
    default:  "bg-gray-100 text-gray-600",
    primary:  "bg-blue-100 text-blue-700",
    success:  "bg-green-100 text-green-700",
    warning:  "bg-yellow-100 text-yellow-700",
    danger:   "bg-red-100 text-red-700",
    purple:   "bg-purple-100 text-purple-700",
  }

  const dotColors = {
    default:  "bg-gray-400",
    primary:  "bg-blue-500",
    success:  "bg-green-500",
    warning:  "bg-yellow-500",
    danger:   "bg-red-500",
    purple:   "bg-purple-500",
  }

  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  return (
    <span className={`inline-flex items-center gap-1.5
      font-body font-medium rounded-full
      ${variants[variant]} ${sizes[size]}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full
          flex-shrink-0 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
}

export default Badge