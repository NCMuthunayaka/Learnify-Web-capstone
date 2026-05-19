import { useState } from "react"
import { Send } from "lucide-react"
import StarRating from "./StarRating"

const categories = [
  { value: "bug", label: "🐛 Bug Report", description: "Report a technical issue" },
  { value: "feature", label: "✨ Feature Request", description: "Suggest a new feature" },
  { value: "improvement", label: "📈 Improvement", description: "Improve existing feature" },
  { value: "other", label: "💬 Other", description: "General feedback" },
]

function FeedbackForm({ onSubmit, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    category: "other",
    title: "",
    content: "",
    rating: 0,
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Feedback content is required"
    } else if (formData.content.length < 20) {
      newErrors.content = "Feedback must be at least 20 characters"
    }

    if (formData.rating === 0) {
      newErrors.rating = "Please select a rating"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      setFormData({
        category: "other",
        title: "",
        content: "",
        rating: 0,
      })
      setErrors({})
    } catch (err) {
      console.error("Error submitting feedback:", err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Share Your Feedback</h2>
        <p className="text-slate-600">Help us improve your learning experience</p>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Category</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat.value })}
              className={`rounded-lg border-2 p-3 text-left text-sm font-medium transition ${
                formData.category === cat.value
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="text-lg">{cat.label.split(" ")[0]}</div>
              <div className="text-xs text-slate-500">{cat.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="Brief summary of your feedback"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value })
            if (errors.title) setErrors({ ...errors, title: "" })
          }}
          className={`w-full rounded-lg border px-4 py-2 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
            errors.title ? "border-rose-500" : "border-slate-200"
          }`}
        />
        {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
      </div>

      {/* Content Input */}
      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-semibold text-slate-700">
          Detailed Feedback <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="content"
          placeholder="Provide detailed feedback... (minimum 20 characters)"
          value={formData.content}
          onChange={(e) => {
            setFormData({ ...formData, content: e.target.value })
            if (errors.content) setErrors({ ...errors, content: "" })
          }}
          rows={6}
          className={`w-full rounded-lg border px-4 py-2 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 ${
            errors.content ? "border-rose-500" : "border-slate-200"
          }`}
        />
        <div className="flex justify-between">
          <p className="text-xs text-slate-500">{formData.content.length} characters</p>
          {errors.content && <p className="text-xs text-rose-500">{errors.content}</p>}
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Overall Rating <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => {
              setFormData({ ...formData, rating })
              if (errors.rating) setErrors({ ...errors, rating: "" })
            }}
            size="lg"
          />
        </div>
        {errors.rating && <p className="text-xs text-rose-500">{errors.rating}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Send size={18} />
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  )
}

export default FeedbackForm
