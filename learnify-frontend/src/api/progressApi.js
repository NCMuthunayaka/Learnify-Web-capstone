import api from "./axiosInstance"

// GET /api/progress/summary
// Returns: stats, streak_days, study_chart, time_alloc,
//          subject_progress, heatmap, tasks
export async function getProgressSummary() {
    const response = await api.get("/progress/summary")
    return response.data
}

// GET /api/progress/report
// Returns: AI study analysis report
export async function getProgressReport() {
    const response = await api.get("/progress/report")
    return response.data
}
