import api from "./axiosInstance"

// ── Submit Feedback ───────────────────────────────────────
// Sends feedback to backend; sentiment is analyzed automatically
export async function submitFeedback(feedbackData) {
    const response = await api.post("/feedback", feedbackData)
    return response.data
}

// ── Get My Feedback ───────────────────────────────────────
// Returns only the logged-in user's own submissions
export async function getMyFeedback() {
    const response = await api.get("/feedback/my")
    return response.data
}

// ── Get All Feedback (Admin) ──────────────────────────────
export async function getAllFeedback(filters = {}) {
    const response = await api.get("/feedback", { params: filters })
    return response.data
}

// ── Get Feedback Stats (Admin) ────────────────────────────
export async function getFeedbackStats() {
    const response = await api.get("/feedback/stats")
    return response.data
}
