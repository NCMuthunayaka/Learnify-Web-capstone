import { useState } from "react"
import StarRating from "./StarRating"
import { submitFeedback } from "../../api/feedbackApi"

const CATEGORIES = ["Mentor Quality", "Session Quality", "Platform Issue", "AI Assistant", "General"]

export default function FeedbackForm({ onSuccess }) {
  const [form,    setForm]    = useState({ subject: "", category: "General", comment: "", rating: 0 })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.rating === 0)        { setError("Please select a rating."); return }
    if (!form.comment.trim())     { setError("Please write a comment."); return }
    setError(null)
    setLoading(true)
    try {
      const result = await submitFeedback(form)
      setForm({ subject: "", category: "General", comment: "", rating: 0 })
      onSuccess?.(result.data)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="font-heading text-base font-bold text-[#0A1931]">Leave Feedback</h2>
        <p className="font-body text-xs text-gray-400 mt-0.5">
          Share your experience — sentiment is analysed automatically
        </p>
      </div>

      {/* Subject */}
      <div>
        <label className="font-body text-xs font-semibold text-gray-600 mb-1.5 block">
          Subject / Topic
        </label>
        <input
          type="text"
          placeholder="e.g. Calculus, Platform, AI Chat…"
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          required
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-body text-sm
            text-gray-700 focus:outline-none focus:border-[#4A7FA7] transition-colors"
        />
      </div>

      {/* Category */}
      <div>
        <label className="font-body text-xs font-semibold text-gray-600 mb-1.5 block">Category</label>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-body text-sm
            text-gray-700 focus:outline-none focus:border-[#4A7FA7] transition-colors"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Rating */}
      <div>
        <label className="font-body text-xs font-semibold text-gray-600 mb-1.5 block">Rating</label>
        <StarRating rating={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} size={22} />
      </div>

      {/* Comment */}
      <div>
        <label className="font-body text-xs font-semibold text-gray-600 mb-1.5 block">Your Feedback</label>
        <textarea
          rows={4}
          placeholder="Describe your experience in detail…"
          value={form.comment}
          onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
          required
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-body text-sm
            text-gray-700 focus:outline-none focus:border-[#4A7FA7] transition-colors resize-none"
        />
      </div>

      {error && <p className="font-body text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#1A3D63] text-white rounded-xl font-body text-sm font-semibold
          hover:bg-[#0A1931] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  )
}