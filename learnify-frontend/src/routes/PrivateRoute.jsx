import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

// ── PrivateRoute ──────────────────────────────────────────
// Protects pages from unauthenticated users
// Optionally checks user role for role-based access

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  const token = localStorage.getItem("access_token")

  // No token — not logged in — redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Decode JWT and check expiry + role
  try {
    const payload  = JSON.parse(atob(token.split(".")[1]))

    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.clear()
      return <Navigate to="/login" replace />
    }

    // If roles are specified, check user's role (prefer live user object from auth context)
    if (roles && roles.length > 0) {
      const userRole = user?.role || payload.role
      if (!roles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />
      }
    }
  } catch {
    // Malformed token — redirect to login
    localStorage.clear()
    return <Navigate to="/login" replace />
  }

  // All checks passed — show the page
  return children
}

export default PrivateRoute