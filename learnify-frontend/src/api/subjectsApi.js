import api from "./axiosInstance"

// ── Get All Subjects ──────────────────────────────────────
// Fetches all subjects from database
// Used for filters, dropdowns and color coding
export async function getSubjects() {
    const response = await api.get("/subjects")
    return response.data
}

export async function createSubject(name, colorHex = "#3b719f") {
    const response = await api.post("/subjects", { name, color_hex: colorHex })
    return response.data
}