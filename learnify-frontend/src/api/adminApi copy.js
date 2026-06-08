import api from "./axiosInstance"

export async function getAdminStats() {
    const response = await api.get("/admin/stats")
    return response.data
}

export async function getAllUsers(page = 1, role = null, status = null) {
    const params = { page }
    if (role)   params.role   = role
    if (status) params.status = status
    const response = await api.get("/admin/users", { params })
    return response.data
}

export async function updateUserStatus(userId, status) {
    const response = await api.patch(`/admin/users/${userId}/status`, { status })
    return response.data
}

export async function deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
}

export async function getPendingApprovals() {
    const response = await api.get("/admin/approvals/pending")
    return response.data
}

export async function approveUser(userId) {
    const response = await api.post(`/admin/approvals/${userId}/approve`)
    return response.data
}

export async function rejectUser(userId) {
    const response = await api.post(`/admin/approvals/${userId}/reject`)
    return response.data
}

export async function getPlatformAnalytics() {
    const response = await api.get("/admin/analytics")
    return response.data
}

export async function getSystemHealth() {
    const response = await api.get("/admin/system/health")
    return response.data
}

export async function getAllFeedback(page = 1, filters = {}) {
    const params = { page, ...filters }
    const response = await api.get("/admin/feedback", { params })
    return response.data
}

export async function getFeedbackStats() {
    const response = await api.get("/admin/feedback/stats")
    return response.data
}
