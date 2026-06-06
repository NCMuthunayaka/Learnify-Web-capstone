import axios from "axios"

// ── Create Axios Instance ─────────────────────────────────
const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
})

// ── Request Interceptor ───────────────────────────────────
// Automatically attaches JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────
// Handles common errors globally
api.interceptors.response.use(
    // Success — return response as is
    (response) => response,

    // Error — handle globally
    async (error) => {
        const originalRequest = error.config

        // Token expired — try to refresh once
        if (error.response?.status === 401 &&
            !originalRequest._retry) {

            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem("refresh_token")

                if (refreshToken) {
                    // Try to get a new access token
                    const response = await axios.post(
                        "http://localhost:5000/api/auth/refresh",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`
                            }
                        }
                    )

                    const newToken = response.data.data.access_token
                    localStorage.setItem("access_token", newToken)

                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return api(originalRequest)
                }
            } catch {
                // Refresh failed — clear everything and go to login
                localStorage.clear()
                window.location.href = "/login"
            }
        }

        return Promise.reject(error)
    }
)

export default api