import api from "./axiosInstance"

// POST /api/tracking/sessions/:id/start
export async function startSession(sessionId) {
    const response = await api.post(`/tracking/sessions/${sessionId}/start`)
    return response.data
}

// POST /api/tracking/sessions/:id/end
export async function endSession(sessionId, status, hours) {
    const response = await api.post(`/tracking/sessions/${sessionId}/end`, {
        status,
        hours
    })
    return response.data
}
