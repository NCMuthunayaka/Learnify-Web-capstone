import { createContext, useState } from "react"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser]   = useState(null)
    const [token, setToken] = useState(
        localStorage.getItem("access_token") || null
    )

    function login(userData, accessToken, refreshToken) {
        // Save user data in state
        setUser(userData)
        setToken(accessToken)

        // Save tokens in localStorage so they persist
        // after page refresh
        localStorage.setItem("access_token",  accessToken)
        localStorage.setItem("refresh_token", refreshToken)
    }

    function logout() {
        // Clear everything
        setUser(null)
        setToken(null)
        localStorage.clear()
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}