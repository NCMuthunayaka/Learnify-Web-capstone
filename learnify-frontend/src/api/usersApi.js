import api from "./axiosInstance"

export async function getProfile() {
    const response = await api.get("/users/profile")
    return response.data
}

export async function updateProfile(profileData) {
    const response = await api.patch("/users/profile", profileData)
    return response.data
}

export async function changePassword(currentPassword, newPassword) {
    const response = await api.patch("/users/change-password", {
        current_password: currentPassword,
        new_password:     newPassword,
    })
    return response.data
}

export async function getStudentsList() {
    const response = await api.get("/users/students")
    return response.data
}

export async function deleteAccount(password) {
    const response = await api.delete("/users/account", {
        data: { password }
    })
    return response.data
}