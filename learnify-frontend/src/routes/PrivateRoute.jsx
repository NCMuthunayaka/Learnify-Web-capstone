import { Navigate } from "react-router-dom"

// ── PrivateRoute ──────────────────────────────────────────
// Protects pages from unauthenticated users
// Optionally checks user role for role-based access
//
// Usage:
// <PrivateRoute>                    → any logged in user
// <PrivateRoute roles={["mentor"]}> → mentor only
// <PrivateRoute roles={["admin"]}>  → admin only

function PrivateRoute({ children, roles }) {
  // Get token from localStorage
  const token = localStorage.getItem("access_token")

  // No token — not logged in — redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check user's role from JWT
  if (roles && roles.length > 0) {
    try {
      // Decode JWT payload
      // JWT has 3 parts: header.payload.signature
      // We decode the middle part (payload)
      const payload  = JSON.parse(atob(token.split(".")[1]))
      const userRole = payload.role

      // Role not allowed — redirect to dashboard
      if (!roles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />
      }
    } catch {
      // Invalid token — redirect to login
      localStorage.clear()
      return <Navigate to="/login" replace />
    }
  }

  // All checks passed — show the page
  return children
}

export default PrivateRoute