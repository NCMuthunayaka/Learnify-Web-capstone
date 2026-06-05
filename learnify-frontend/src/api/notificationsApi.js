import api from "./axiosInstance"

// ── Get All Notifications ─────────────────────────────────
// Fetches all notifications for logged in user
// Also returns unread count for bell badge
export async function getNotifications() {
    const response = await api.get("/notifications")
    return response.data
}

// ── Mark One As Read ──────────────────────────────────────
// Marks a single notification as read by ID
export async function markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
}

// ── Mark All As Read ──────────────────────────────────────
// Marks all notifications as read at once
export async function markAllAsRead() {
    const response = await api.patch("/notifications/read-all")
    return response.data
}

// ── Delete Notification ───────────────────────────────────
// Deletes a notification by ID
export async function deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
}