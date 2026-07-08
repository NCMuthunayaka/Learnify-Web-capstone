import api from "./axiosInstance"

// ── Get Help Requests ───────────────────────────────────────
// Get previous requests submitted by the student user
export async function getHelpRequests() {
    const response = await api.get("/help_requests")
    return response.data
}

// ── Create Help Request ─────────────────────────────────────
// Submit a new help request ticket to mentors or peers
export async function createHelpRequest(requestData) {
    const response = await api.post("/help_requests", requestData)
    return response.data
}

// ── Get Available Mentors ───────────────────────────────────
// Get list of mentors, specialty, and schedule slots for request dropdown
export async function getAvailableMentors() {
    const response = await api.get("/help_requests/mentors")
    return response.data
}
