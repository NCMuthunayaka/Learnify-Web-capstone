import { useState, useEffect } from "react"
import { MessageSquare, HeartHandshake, Sparkles, MessageSquareQuote } from "lucide-react"
import FeedbackForm from "../components/feedback/FeedbackForm"
import FeedbackCard from "../components/feedback/FeedbackCard"
import CategoryFilter from "../components/feedback/CategoryFilter"
import { getMyFeedback } from "../api/feedbackApi"

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [category,     setCategory]     = useState("All")

  useEffect(() => {
    getMyFeedback()
      .then(res => setFeedbackList(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleNewFeedback(newItem) {
    setFeedbackList(prev => [newItem, ...prev])
  }

  const filtered = category === "All"
    ? feedbackList
    : feedbackList.filter(f => f.category === category)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-[#0A1931]">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-[#0A1931] via-[#1A3D63] to-[#2B547E] rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/15 backdrop-blur-md text-white font-body text-xs font-bold px-3 py-1 rounded-full border border-white/20 inline-flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              Platform Improvements
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Feedback & Suggestions
            </h1>
            <p className="font-body text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl leading-relaxed">
              Help us shape the future of Learnify. Submit your experience, report issues, or suggest new features directly to our System Administrator.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 shrink-0">
            <HeartHandshake size={32} className="text-blue-200" />
          </div>
        </div>
      </div>

      {/* Submit Form Card */}
      <FeedbackForm onSuccess={handleNewFeedback} />

      {/* Past Submissions Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0A1931] flex items-center gap-2">
              <MessageSquareQuote size={20} className="text-[#3b719f]" />
              Your Previous Feedback
              <span className="font-body text-xs font-bold bg-blue-50 text-[#3b719f] px-3 py-1 rounded-full border border-blue-100">
                {filtered.length}
              </span>
            </h2>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              Review all past feedback submissions and rating scores sent from your account.
            </p>
          </div>

          <CategoryFilter value={category} onChange={setCategory} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-[#3b719f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body text-xs text-slate-400 mt-3 font-semibold">Loading your submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center bg-[#F8FAFC] rounded-2xl border border-slate-200/80 space-y-2">
            <MessageSquare size={36} className="mx-auto text-slate-300 mb-1" />
            <p className="font-heading text-sm font-bold text-[#0A1931]">No Feedback Submitted Yet</p>
            <p className="font-body text-xs text-slate-400">Fill out the form above to send your first feedback review to the Admin!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(fb => <FeedbackCard key={fb.id} feedback={fb} />)}
          </div>
        )}
      </div>

    </div>
  )
}