function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  type = "button",
  fullWidth = false,
  icon: Icon,
}) {
  const variants = {
    primary:   "bg-[#1A3D63] text-white hover:bg-[#4A7FA7] border-transparent",
    secondary: "bg-white text-[#1A3D63] hover:bg-gray-50 border-gray-200",
    danger:    "bg-red-500 text-white hover:bg-red-600 border-transparent",
    ghost:     "bg-transparent text-[#1A3D63] hover:bg-gray-100 border-transparent",
    outline:   "bg-transparent text-[#1A3D63] hover:bg-[#1A3D63] hover:text-white border-[#1A3D63]",
  }

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-6 py-3",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-body font-medium rounded-lg border
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  )
}

export default Button