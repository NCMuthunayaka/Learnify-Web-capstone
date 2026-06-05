import api from "./axiosInstance"

// ── Get All Resources ─────────────────────────────────────
// Fetches all published resources
// Optional filters: subject_id, file_type_id, search
export async function getResources(filters = {}) {
    const response = await api.get("/resources", {
        params: filters  // adds ?subject_id=1 etc to URL
    })
    return response.data
}

// ── Get Single Resource ───────────────────────────────────
// Fetches one resource by ID
// Also increments view count on backend
export async function getResource(id) {
    const response = await api.get(`/resources/${id}`)
    return response.data
}

// ── Upload Resource ───────────────────────────────────────
// Creates a new resource (mentor only)
export async function uploadResource(resourceData) {
    const response = await api.post("/resources", resourceData)
    return response.data
}

// ── Delete Resource ───────────────────────────────────────
// Deletes a resource by ID (mentor only — own resources)
export async function deleteResource(id) {
    const response = await api.delete(`/resources/${id}`)
    return response.data
}

// ── Track Download ────────────────────────────────────────
// Increments download count and returns file URL
export async function trackDownload(id) {
    const response = await api.post(`/resources/${id}/download`)
    return response.data
}