import { useState, useEffect } from "react"
import { MessageSquare } from "lucide-react"
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-[#0A1931]">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0A1931]">Feedback</h1>
        <p className="font-body text-sm text-gray-400 mt-1">
          Share your experience and view your past submissions
        </p>
      </div>

      {/* Submit form */}
      <FeedbackForm onSuccess={handleNewFeedback} />

      {/* Past submissions */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold text-[#0A1931]">
          Your Submissions
          <span className="ml-2 font-body text-xs font-semibold bg-[#EBF3F9] text-[#1A3D63]
            px-2.5 py-0.5 rounded-full border border-[#D5E6F2]">
            {filtered.length}
          </span>
        </h2>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-[#4A7FA7] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="font-body text-sm text-gray-400">No feedback yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(fb => <FeedbackCard key={fb.id} feedback={fb} />)}
        </div>
      )}
    </div>
  )
}