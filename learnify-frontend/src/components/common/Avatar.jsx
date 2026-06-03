function Avatar({
  name = "",
  size = "md",
  color = "primary",
  src = null,
}) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  }

  const colors = {
    primary: "bg-[#1A3D63]",
    accent:  "bg-[#4A7FA7]",
    green:   "bg-green-500",
    purple:  "bg-purple-500",
    orange:  "bg-orange-500",
    red:     "bg-red-500",
  }

  // Get initials from name
  function getInitials(name) {
    if (!name) return "?"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <div className={`rounded-full flex items-center justify-center
      flex-shrink-0 font-heading font-bold text-white overflow-hidden
      ${sizes[size]} ${!src ? colors[color] : ""}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

export default Avatar