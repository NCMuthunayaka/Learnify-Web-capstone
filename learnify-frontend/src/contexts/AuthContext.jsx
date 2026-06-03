import { createContext, useState } from "react"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    localStorage.getItem("access_token") || null
  )

  function login(userData, accessToken) {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem("access_token", accessToken)
  }

  function logout() {
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