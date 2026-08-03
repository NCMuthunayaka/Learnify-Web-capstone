import api from "./axiosInstance"

// ── Fetch Admin Resources with sorting and filtering ───────
export async function getAdminResources(params = {}) {
    const response = await api.get("/admin/resources", { params })
    return response.data
}

// ── Delete single resource (admin) ──────────────────────────
export async function deleteAdminResource(resourceId) {
    const response = await api.delete(`/resources/${resourceId}`)
    return response.data
}

// ── Batch delete resources (admin) ──────────────────────────
export async function deleteAdminResourcesBatch(resourceIds) {
    const response = await api.delete("/admin/resources/batch", {
        data: { resource_ids: resourceIds }
    })
    return response.data
}
