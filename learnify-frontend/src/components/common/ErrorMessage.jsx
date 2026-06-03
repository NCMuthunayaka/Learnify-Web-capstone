import { AlertCircle, X, RefreshCw } from "lucide-react"

function ErrorMessage({
  message = "Something went wrong. Please try again.",
  onRetry,
  onDismiss,
  variant = "default",
}) {
  const variants = {
    default: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3
      rounded-xl border ${variants[variant]}`}>

      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />

      <p className="font-body text-sm flex-1 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 rounded hover:bg-red-100
              transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-red-100
              transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

    </div>
  )
}

export default ErrorMessage