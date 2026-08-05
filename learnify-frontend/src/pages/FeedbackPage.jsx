import { useState, useEffect } from "react"
import { AlertCircle, Loader } from "lucide-react"
import feedbackApi from "../api/feedbackApi"
import { useAuth } from "../hooks/useAuth"
import FeedbackForm from "../components/feedback/FeedbackForm"
import FeedbackCard from "../components/feedback/FeedbackCard"
import CategoryFilter from "../components/feedback/CategoryFilter"

function FeedbackPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadFeedbacks()
  }, [selectedCategory])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = selectedCategory !== "all" ? { category: selectedCategory } : {}

      const data = isAdmin
        ? await feedbackApi.getAllFeedback(filters)
        : await feedbackApi.getUserFeedback(filters)

      setFeedbacks(data.feedbacks || [])
    } catch (err) {
      setError(err.message || "Failed to load feedback")
      console.error("Error loading feedback:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async (formData) => {
    try {
      setSubmitting(true)
      setError(null)

      if (editingId) {
        await feedbackApi.updateFeedback(editingId, formData)
        setSuccess("Feedback updated successfully!")
        setEditingId(null)
      } else {
        await feedbackApi.createFeedback(formData)
        setSuccess("Feedback submitted successfully! Thank you for your input.")
      }

      await loadFeedbacks()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to submit feedback")
      console.error("Error submitting feedback:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) {
      return
    }

    try {
      setError(null)
      await feedbackApi.deleteFeedback(feedbackId)
      setSuccess("Feedback deleted successfully!")
      await loadFeedbacks()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to delete feedback")
      console.error("Error deleting feedback:", err)
    }
  }

  const handleResolveFeedback = async (feedbackId) => {
    const adminResponse = prompt("Enter your response to this feedback:")

    if (adminResponse === null) return

    try {
      setError(null)
      await feedbackApi.resolveFeedback(feedbackId, adminResponse)
      setSuccess("Feedback marked as resolved!")
      await loadFeedbacks()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to resolve feedback")
      console.error("Error resolving feedback:", err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Feedback & Support</h1>
          <p className="text-lg text-slate-600">
            Share your thoughts to help us improve Learnify
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 border border-emerald-200">
            <AlertCircle size={20} />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-rose-50 px-4 py-3 text-rose-800 border border-rose-200">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Feedback Form */}
        <FeedbackForm onSubmit={handleSubmitFeedback} isSubmitting={submitting} />

        {/* Divider */}
        <div className="border-t-2 border-slate-200" />

        {/* Your Feedback Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isAdmin ? "All Feedback" : "Your Feedback"}
            </h2>
            <p className="text-slate-600">
              {isAdmin ? "Review and manage all user feedback" : "Track your submitted feedback"}
            </p>
          </div>

          {/* Category Filter */}
          {!isAdmin && (
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg text-slate-600">
                {isAdmin ? "No feedback yet" : "You haven't submitted any feedback yet"}
              </p>
              {!isAdmin && (
                <p className="mt-2 text-sm text-slate-500">Start by sharing your thoughts above!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  onEdit={() => setEditingId(feedback.id)}
                  onDelete={handleDeleteFeedback}
                  isAdmin={isAdmin}
                  onResolve={isAdmin ? handleResolveFeedback : null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeedbackPage