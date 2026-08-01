import { useState } from "react"
import { Send, Sparkles, CheckCircle2, MessageSquare, Tag, PenTool } from "lucide-react"
import StarRating from "./StarRating"
import { submitFeedback } from "../../api/feedbackApi"

const CATEGORIES = [
  { id: "Mentor Quality", label: "Mentor Quality", icon: "👨‍🏫" },
  { id: "Session Quality", label: "Session Quality", icon: "📚" },
  { id: "Platform Issue", label: "Platform Issue", icon: "🐛" },
  { id: "AI Assistant", label: "AI Assistant", icon: "🤖" },
  { id: "General", label: "General", icon: "💡" },
]

export default function FeedbackForm({ onSuccess }) {
  const [form, setForm]       = useState({ subject: "", category: "General", comment: "", rating: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.rating === 0)    { setError("Please select a rating star!"); return }
    if (!form.comment.trim()) { setError("Please describe your experience or feedback."); return }
    setError(null)
    setSuccessMsg(null)
    setLoading(true)
    try {
      const result = await submitFeedback(form)
      setForm({ subject: "", category: "General", comment: "", rating: 0 })
      setSuccessMsg("Thank you! Your feedback has been sent directly to the Administrator.")
      onSuccess?.(result.data)
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
      
      {/* Form Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="font-heading text-lg font-bold text-[#0A1931] flex items-center gap-2">
            <PenTool size={20} className="text-[#3b719f]" />
            Submit Your Feedback
          </h2>
          <p className="font-body text-xs text-slate-500 mt-0.5">
            Your review will be sent directly to the System Admin for continuous platform improvement.
          </p>
        </div>
        <span className="bg-blue-50 text-[#3b719f] font-body text-xs font-bold px-3 py-1 rounded-full border border-blue-100 hidden sm:inline-block">
          Direct to Admin
        </span>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl font-body text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="bg-transparent border-none text-emerald-700 cursor-pointer font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Rating Section Sub-Container */}
        <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <label className="font-body text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Rate Your Experience *
          </label>
          <StarRating rating={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} size={24} />
        </div>

        {/* Category Pills Selector */}
        <div>
          <label className="font-body text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5 block">
            <Tag size={14} className="text-[#3b719f]" />
            Select Category *
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: c.id }))}
                className={`font-body text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  form.category === c.id
                    ? "bg-[#1A3D63] text-white border-[#1A3D63] shadow-xs"
                    : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Input */}
        <div>
          <label className="font-body text-xs font-semibold text-slate-700 mb-1.5 block">
            Subject / Topic *
          </label>
          <input
            type="text"
            placeholder="e.g. Calculus tutoring, Platform performance, AI Assistant response…"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            required
            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-body text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#3b719f] focus:ring-2 focus:ring-[#3b719f]/15 transition-all shadow-xs"
          />
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="font-body text-xs font-semibold text-slate-700 mb-1.5 block">
            Your Detailed Feedback *
          </label>
          <textarea
            rows={4}
            placeholder="Describe your feedback, suggestion, or issue in detail..."
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            required
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl font-body text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#3b719f] focus:ring-2 focus:ring-[#3b719f]/15 transition-all resize-none shadow-xs"
          />
        </div>

        {error && (
          <p className="font-body text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1A3D63] hover:bg-[#0A1931] text-white rounded-xl font-body text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
        >
          <Send size={16} />
          {loading ? "Submitting to Admin..." : "Send Feedback to Admin"}
        </button>
      </form>
    </div>
  )
}