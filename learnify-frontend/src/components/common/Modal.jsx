import { useEffect } from "react"
import { X } from "lucide-react"

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
}) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }

  // Close on Escape key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "auto"
    return () => { document.body.style.overflow = "auto" }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center
      justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className={`relative bg-white rounded-2xl shadow-2xl
        w-full ${sizes[size]} z-10`}>

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between
            px-6 py-4 border-b border-gray-100">
            {title && (
              <h3 className="font-heading text-base font-semibold
                text-[#0A1931]">
                {title}
              </h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-300 hover:text-gray-500
                  rounded-lg hover:bg-gray-100 transition-colors ml-auto"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">
          {children}
        </div>

      </div>
    </div>
  )
}

export default Modal