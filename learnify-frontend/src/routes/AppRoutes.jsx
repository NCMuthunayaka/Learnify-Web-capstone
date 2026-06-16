import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import LandingLayout from "../components/layout/LandingLayout"
import PrivateRoute from "./PrivateRoute"

// Pages
import LandingPage                from "../pages/LandingPage"
import DashboardPage              from "../pages/DashboardPage"
import ProgressPage               from "../pages/ProgressPage"
import SchedulerPage              from "../pages/SchedulerPage"
import AIChatPage                 from "../pages/AIChatPage"
import ResourcesPage              from "../pages/ResourcesPage"
import FeedbackPage               from "../pages/FeedbackPage"
import ProfilePage                from "../pages/ProfilePage"
import LoginPage                  from "../pages/auth/LoginPage"
import RegisterPage               from "../pages/auth/RegisterPage"
import MentorResourcesPage        from "../pages/mentor/MentorResourcesPage"
import MentorProfilePage          from "../pages/mentor/MentorProfilePage"
import MentorDashboardPage        from "../pages/mentor/MentorDashboardPage"
import MentorRequestsPage         from "../pages/mentor/MentorRequestsPage"
import NotificationsPage          from "../pages/NotificationsPage"
import HelpPage                   from "../pages/HelpPage"
import AdminAnalyticsPage         from "../pages/admin/AdminAnalyticsPage"
import AdminFeedbackDashboard     from "../pages/admin/AdminFeedbackDashboard"
import AdminUsersPage             from "../pages/admin/AdminUsersPage"
import AdminApprovalsPage         from "../pages/admin/AdminApprovalsPage"
import AdminSystemMonitoringPage  from "../pages/admin/AdminSystemMonitoringPage"
import AdminProfilePage           from "../pages/admin/AdminProfilePage"
import AdminEditProfilePage       from "../pages/admin/AdminEditProfilePage"
import AdminChangePasswordPage    from "../pages/admin/AdminChangePasswordPage"

// ── Dashboard Dispatcher ──────────────────────────────────
// Renders the correct dashboard based on user role
// Student  → DashboardPage
// Mentor   → MentorDashboardPage
// Admin    → redirect to /admin/dashboard
function DashboardDispatcher() {
  const token = localStorage.getItem("access_token")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const role    = payload.role

    if (role === "mentor") {
      return <MentorDashboardPage />  // ✅ render directly
    }
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />
    }
  } catch (err) {
    console.error("Failed to parse token:", err)
    return <Navigate to="/login" replace />
  }

  // Default — student
  return <DashboardPage />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public Routes ── */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Protected Routes ── */}
        <Route element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>

          {/* ── Single /dashboard route — dispatcher handles role ── */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <DashboardDispatcher />
            </PrivateRoute>
          } />

          {/* ── Shared pages — all roles ── */}
          <Route path="/notifications" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <NotificationsPage />
            </PrivateRoute>
          } />

          <Route path="/ai-chat" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <AIChatPage />
            </PrivateRoute>
          } />

          <Route path="/feedback" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <FeedbackPage />
            </PrivateRoute>
          } />

          <Route path="/help" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <HelpPage />
            </PrivateRoute>
          } />

          {/* ── Student only ── */}
          <Route path="/scheduler" element={
            <PrivateRoute roles={["student"]}>
              <SchedulerPage />
            </PrivateRoute>
          } />

          <Route path="/progress" element={
            <PrivateRoute roles={["student"]}>
              <ProgressPage />
            </PrivateRoute>
          } />

          <Route path="/resources" element={
            <PrivateRoute roles={["student"]}>
              <ResourcesPage />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute roles={["student"]}>
              <ProfilePage />
            </PrivateRoute>
          } />

          {/* ── Mentor only ── */}
          <Route path="/mentor/requests" element={
            <PrivateRoute roles={["mentor", "admin"]}>
              <MentorRequestsPage />
            </PrivateRoute>
          } />

          <Route path="/mentor/resources" element={
            <PrivateRoute roles={["mentor", "admin"]}>
              <MentorResourcesPage />
            </PrivateRoute>
          } />

          <Route path="/mentor/profile" element={
            <PrivateRoute roles={["mentor", "admin"]}>
              <MentorProfilePage />
            </PrivateRoute>
          } />

          {/* ── Admin only ── */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={["admin"]}>
              <AdminAnalyticsPage />
            </PrivateRoute>
          } />

          <Route path="/admin/feedback" element={
            <PrivateRoute roles={["admin"]}>
              <AdminFeedbackDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin/users" element={
            <PrivateRoute roles={["admin"]}>
              <AdminUsersPage />
            </PrivateRoute>
          } />

          <Route path="/admin/approvals" element={
            <PrivateRoute roles={["admin"]}>
              <AdminApprovalsPage />
            </PrivateRoute>
          } />

          <Route path="/admin/system" element={
            <PrivateRoute roles={["admin"]}>
              <AdminSystemMonitoringPage />
            </PrivateRoute>
          } />

          <Route path="/admin/profile" element={
            <PrivateRoute roles={["admin"]}>
              <AdminProfilePage />
            </PrivateRoute>
          } />

          <Route path="/admin/profile/edit" element={
            <PrivateRoute roles={["admin"]}>
              <AdminEditProfilePage />
            </PrivateRoute>
          } />

          <Route path="/admin/change-password" element={
            <PrivateRoute roles={["admin"]}>
              <AdminChangePasswordPage />
            </PrivateRoute>
          } />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes