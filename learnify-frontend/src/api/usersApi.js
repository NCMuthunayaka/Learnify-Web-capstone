import api from "./axiosInstance"

// ── Get Profile ───────────────────────────────────────────
// Fetches currently logged in user's profile
export async function getProfile() {
    const response = await api.get("/users/profile")
    return response.data
}

// ── Update Profile ────────────────────────────────────────
// Updates currently logged in user's profile
// Only name and avatar_url can be changed
export async function updateProfile(profileData) {
    const response = await api.patch("/users/profile", profileData)
    return response.data
}

// ── Change Password ───────────────────────────────────────
// Changes the current user's password
// Requires current password for verification
export async function changePassword(currentPassword, newPassword) {
    const response = await api.patch("/users/change-password", {
        current_password: currentPassword,
        new_password:     newPassword,
    })
    return response.data
}