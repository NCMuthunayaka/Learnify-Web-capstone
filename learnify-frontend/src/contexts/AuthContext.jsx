import { createContext, useState, useCallback } from "react"
import authApi from "../api/authApi"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    localStorage.getItem("access_token") || null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const register = useCallback(async (email, firstName, lastName, password, confirmPassword, role = "student") => {
    setLoading(true)
    setError(null)
    try {
      const response = await authApi.register(email, firstName, lastName, password, confirmPassword, role)
      if (response?.access_token) {
        setToken(response.access_token)
        localStorage.setItem("access_token", response.access_token)
        if (response.refresh_token) {
          localStorage.setItem("refresh_token", response.refresh_token)
        }
        setUser(response.user)
      }
      return response
    } catch (err) {
      const errorMessage = err.error?.message || err.message || "Registration failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authApi.login(email, password)
      if (response?.access_token) {
        setToken(response.access_token)
        localStorage.setItem("access_token", response.access_token)
        if (response.refresh_token) {
          localStorage.setItem("refresh_token", response.refresh_token)
        }
        setUser(response.user)
      }
      return response
    } catch (err) {
      const errorMessage = err.error?.message || err.message || "Login failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setError(null)
    authApi.logout()
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}