import axiosInstance from "./axiosInstance"

const feedbackApi = {
  /**
   * Create new feedback
   */
  createFeedback: async (feedbackData) => {
    const response = await axiosInstance.post("/feedback", feedbackData)
    return response.data.data
  },

  /**
   * Get current user's feedback
   */
  getUserFeedback: async (filters = {}) => {
    const response = await axiosInstance.get("/feedback", { params: filters })
    return response.data.data
  },

  /**
   * Get feedback by ID
   */
  getFeedbackById: async (feedbackId) => {
    const response = await axiosInstance.get(`/feedback/${feedbackId}`)
    return response.data.data
  },

  /**
   * Update feedback
   */
  updateFeedback: async (feedbackId, feedbackData) => {
    const response = await axiosInstance.put(`/feedback/${feedbackId}`, feedbackData)
    return response.data.data
  },

  /**
   * Delete feedback
   */
  deleteFeedback: async (feedbackId) => {
    const response = await axiosInstance.delete(`/feedback/${feedbackId}`)
    return response.data.data
  },

  /**
   * Get all feedback (admin only)
   */
  getAllFeedback: async (filters = {}) => {
    const response = await axiosInstance.get("/feedback/all", { params: filters })
    return response.data.data
  },

  /**
   * Resolve feedback with admin response
   */
  resolveFeedback: async (feedbackId, adminResponse) => {
    const response = await axiosInstance.post(`/feedback/${feedbackId}/resolve`, {
      admin_response: adminResponse,
    })
    return response.data.data
  },
}

export default feedbackApi
