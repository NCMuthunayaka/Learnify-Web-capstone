import { createContext, useState, useEffect } from "react"
import api from "../api/axiosInstance"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(
    localStorage.getItem("access_token") || null
  )
  const [loading, setLoading] = useState(!!localStorage.getItem("access_token"))

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem("access_token")
      if (storedToken) {
        try {
          const response = await api.get("/auth/me")
          setUser(response.data.data)
        } catch (err) {
          console.error("Failed to restore user session on mount:", err)
          logout()
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  function login(userData, accessToken, refreshToken) {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem("access_token",  accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  }

  async function logout() {
    // Revoke tokens server-side before clearing client state
    try {
      await api.post("/auth/logout")
    } catch {
      // Even if the server call fails, still clear the client session
    }
    // Clear state
    setUser(null)
    setToken(null)
    // Clear localStorage
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading ? children : (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0A1931]">
          <div className="w-10 h-10 border-4 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </AuthContext.Provider>
  )
}