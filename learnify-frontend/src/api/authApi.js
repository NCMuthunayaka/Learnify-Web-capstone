import api from "./axiosInstance"

// ── Login ─────────────────────────────────────────────────
// Sends email and password to backend
// Returns user data and tokens on success
export async function loginUser(email, password) {
    const response = await api.post("/auth/login", {
        email,
        password,
    })
    return response.data
}

// ── Register ──────────────────────────────────────────────
// Sends user details to backend to create a new account
// Returns user data and tokens on success
export async function registerUser(name, email, password, role) {
    const response = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
    })
    return response.data
}

export async function googleAuth(token) {
    // Send Google token to backend for verification
    const response = await api.post("/auth/google", { token })
    return response.data
}

// ── Get Current User ──────────────────────────────────────
// Fetches the currently logged in user's data
// Uses token from axiosInstance automatically
export async function getCurrentUser() {
    const response = await api.get("/auth/me")
    return response.data
}

// ── Refresh Token ─────────────────────────────────────────
// Gets a new access token using refresh token
// Called automatically by axiosInstance interceptor
export async function refreshToken() {
    const response = await api.post("/auth/refresh")
    return response.data
}