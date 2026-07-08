import api from "./axiosInstance"

// ── Upload actual file to server ──────────────────────────
export async function uploadFile(file) {
    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post("/resources/upload-file", formData)
    return response.data
}

// ── Get all resources ─────────────────────────────────────
export async function getResources(filters = {}) {
    const response = await api.get("/resources", { params: filters })
    return response.data
}

// ── Get mentor's own resources ────────────────────────────
export async function getMyResources(filters = {}) {
    const response = await api.get("/resources/my", { params: filters })
    return response.data
}

// ── Get mentor stats ──────────────────────────────────────
export async function getMyStats() {
    const response = await api.get("/resources/my/stats")
    return response.data
}

// ── Get single resource ───────────────────────────────────
export async function getResource(id) {
    const response = await api.get(`/resources/${id}`)
    return response.data
}

// ── Create resource record ────────────────────────────────
export async function uploadResource(resourceData) {
    const response = await api.post("/resources", resourceData)
    return response.data
}

// ── Update resource ───────────────────────────────────────
export async function updateResource(id, resourceData) {
    const response = await api.patch(`/resources/${id}`, resourceData)
    return response.data
}

// ── Delete resource ───────────────────────────────────────
export async function deleteResource(id) {
    const response = await api.delete(`/resources/${id}`)
    return response.data
}

// ── Track download ────────────────────────────────────────
export async function trackDownload(id) {
    const response = await api.post(`/resources/${id}/download`)
    return response.data
}