import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:5000/api",
})

// ── Request Interceptor ───────────────────────────────────
api.interceptors.request.use(
    (config) => {
        // Add auth token
        const token = localStorage.getItem("access_token")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Set Content-Type
        // For FormData — let browser set it automatically (with boundary)
        // For everything else — use JSON
        if (config.data instanceof FormData) {
            // Do nothing — browser sets multipart/form-data + boundary
        } else {
            config.headers["Content-Type"] = "application/json"
        }

        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config

        // Token expired — try refresh once
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem("refresh_token")

                if (refreshToken) {
                    const refreshResponse = await axios.post(
                        "http://localhost:5000/api/auth/refresh",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`
                            }
                        }
                    )

                    const newToken = refreshResponse.data.data.access_token
                    localStorage.setItem("access_token", newToken)
                    originalRequest.headers.Authorization = `Bearer ${newToken}`

                    // For FormData retry — clear Content-Type again
                    if (originalRequest.data instanceof FormData) {
                        delete originalRequest.headers["Content-Type"]
                    }

                    return api(originalRequest)
                }
            } catch {
                localStorage.clear()
                window.location.href = "/login"
            }
        }

        return Promise.reject(error)
    }
)

export default api