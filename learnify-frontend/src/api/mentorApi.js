import api from "./axiosInstance"

// ── Get Mentor Dashboard Stats ─────────────────────────────
// Returns profile, settings, metrics, active sessions, subject progress, notifications
export async function getMentorStats() {
    const response = await api.get("/mentor/dashboard/stats")
    return response.data
}

// ── Update Mentor Settings ──────────────────────────────────
// Updates toggles (urgent, email, auto-accept) and availableDays, fromTime, untilTime, maxRequests
export async function updateMentorSettings(settings) {
    const response = await api.patch("/mentor/settings", settings)
    return response.data
}

// ── Get Help Requests for Mentor ────────────────────────────
// Returns assigned requests and pending unassigned requests matching mentor subject
export async function getMentorRequests() {
    const response = await api.get("/mentor/requests")
    return response.data
}

// ── Accept Request ──────────────────────────────────────────
// Assigns request to mentor and sets status to in_progress
export async function acceptRequest(requestId) {
    const response = await api.post(`/mentor/requests/${requestId}/accept`)
    return response.data
}

// ── Decline / Release Request ───────────────────────────────
// Releases request (unassigns mentor and sets status to pending)
export async function declineRequest(requestId) {
    const response = await api.post(`/mentor/requests/${requestId}/decline`)
    return response.data
}

// ── Resolve Request ─────────────────────────────────────────
// Sets request status to resolved
export async function resolveRequest(requestId) {
    const response = await api.post(`/mentor/requests/${requestId}/resolve`)
    return response.data
}

// ── Send Request Reply ──────────────────────────────────────
// Posts a reply to a help request ticket
export async function sendRequestReply(requestId, content) {
    const response = await api.post(`/mentor/requests/${requestId}/replies`, { content })
    return response.data
}
