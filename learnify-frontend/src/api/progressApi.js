import api from "./axiosInstance"

// GET /api/progress/summary
// Returns: stats, streak_days, study_chart, time_alloc,
//          subject_progress, heatmap, tasks
export async function getProgressSummary() {
    const response = await api.get("/progress/summary")
    return response.data
}
