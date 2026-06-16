import api from "./axiosInstance"
import axios from "axios"

// ── Upload File (actual file to server) ───────────────────
// Step 1 — Upload file, get back file_url
// Step 2 — Create resource record with that file_url
export async function uploadFile(file) {
    // Use FormData to send actual file
    const formData = new FormData()
    formData.append("file", file)

    const token   = localStorage.getItem("access_token")
    const response = await axios.post(
        "http://localhost:5000/api/resources/upload-file",
        formData,
        {
            headers: {
                // Let browser set Content-Type for FormData
                // Don't set it manually — it needs the boundary
                "Authorization": `Bearer ${token}`,
            }
        }
    )
    return response.data
}

// ── Get All Resources (Student) ───────────────────────────
export async function getResources(filters = {}) {
    const response = await api.get("/resources", { params: filters })
    return response.data
}

// ── Get My Resources (Mentor) ─────────────────────────────
export async function getMyResources(filters = {}) {
    const response = await api.get("/resources/my", { params: filters })
    return response.data
}

// ── Get My Stats (Mentor) ─────────────────────────────────
export async function getMyStats() {
    const response = await api.get("/resources/my/stats")
    return response.data
}

// ── Get Single Resource ───────────────────────────────────
export async function getResource(id) {
    const response = await api.get(`/resources/${id}`)
    return response.data
}

// ── Upload Resource Record ────────────────────────────────
export async function uploadResource(resourceData) {
    const response = await api.post("/resources", resourceData)
    return response.data
}

// ── Update Resource ───────────────────────────────────────
export async function updateResource(id, resourceData) {
    const response = await api.patch(`/resources/${id}`, resourceData)
    return response.data
}

// ── Delete Resource ───────────────────────────────────────
export async function deleteResource(id) {
    const response = await api.delete(`/resources/${id}`)
    return response.data
}

// ── Track Download ────────────────────────────────────────
export async function trackDownload(id) {
    const response = await api.post(`/resources/${id}/download`)
    return response.data
}