import { useState, useCallback } from "react"
import feedbackApi from "../api/feedbackApi"

export function useFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createFeedback = useCallback(async (feedbackData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await feedbackApi.createFeedback(feedbackData)
      return response
    } catch (err) {
      setError(err.message || "Failed to create feedback")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getUserFeedback = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await feedbackApi.getUserFeedback(filters)
      setFeedbacks(response.feedbacks || [])
      return response
    } catch (err) {
      setError(err.message || "Failed to load feedback")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateFeedback = useCallback(async (feedbackId, feedbackData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await feedbackApi.updateFeedback(feedbackId, feedbackData)
      return response
    } catch (err) {
      setError(err.message || "Failed to update feedback")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFeedback = useCallback(async (feedbackId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await feedbackApi.deleteFeedback(feedbackId)
      return response
    } catch (err) {
      setError(err.message || "Failed to delete feedback")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    feedbacks,
    loading,
    error,
    createFeedback,
    getUserFeedback,
    updateFeedback,
    deleteFeedback,
  }
}
