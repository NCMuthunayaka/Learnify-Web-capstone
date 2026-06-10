import api from "./axiosInstance"

// ── Get Dashboard Stats ───────────────────────────────────
// Returns stats, weekly chart, deadlines, scheduled subjects
export async function getDashboardStats() {
    const response = await api.get("/dashboard/stats")
    return response.data
}