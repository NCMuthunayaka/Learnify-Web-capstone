import api from "./axiosInstance"

// ── Timetable ─────────────────────────────────────────────
// GET /api/scheduler/timetable
// Returns the student's study sessions for the current week
export async function getTimetable() {
    const response = await api.get("/scheduler/timetable")
    return response.data
}

// ── Tasks ─────────────────────────────────────────────────
// GET /api/scheduler/tasks
export async function getTasks() {
    const response = await api.get("/scheduler/tasks")
    return response.data
}

// POST /api/scheduler/tasks
export async function createTask(data) {
    const response = await api.post("/scheduler/tasks", data)
    return response.data
}

// PUT /api/scheduler/tasks/:id
export async function updateTask(id, data) {
    const response = await api.put(`/scheduler/tasks/${id}`, data)
    return response.data
}

// DELETE /api/scheduler/tasks/:id
export async function deleteTask(id) {
    const response = await api.delete(`/scheduler/tasks/${id}`)
    return response.data
}

// PATCH /api/scheduler/tasks/:id/status  — quick status toggle
export async function updateTaskStatus(id, status) {
    const response = await api.patch(`/scheduler/tasks/${id}/status`, { status })
    return response.data
}

// ── Scheduler Stats ───────────────────────────────────────
// GET /api/scheduler/stats
export async function getSchedulerStats() {
    const response = await api.get("/scheduler/stats")
    return response.data
}

// ── AI Timetable Generation ───────────────────────────────
// POST /api/scheduler/generate
export async function generateTimetable({ intensity, focus_subject, exam_date }) {
    const response = await api.post("/scheduler/generate", {
        intensity,
        focus_subject,
        exam_date,
    })
    return response.data
}
