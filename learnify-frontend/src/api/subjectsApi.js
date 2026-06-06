import api from "./axiosInstance"

// ── Get All Subjects ──────────────────────────────────────
// Fetches all subjects from database
// Used for filters, dropdowns and color coding
export async function getSubjects() {
    const response = await api.get("/subjects")
    return response.data
}