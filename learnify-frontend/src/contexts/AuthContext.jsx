import { createContext, useState } from "react"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(
    localStorage.getItem("access_token") || null
  )

  function login(userData, accessToken, refreshToken) {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem("access_token",  accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  }

  function logout() {
    // Clear state
    setUser(null)
    setToken(null)
    // Clear localStorage
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}