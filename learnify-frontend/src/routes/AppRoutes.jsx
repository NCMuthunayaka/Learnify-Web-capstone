import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import LandingLayout from "../components/layout/LandingLayout"
import PrivateRoute from "./PrivateRoute"

// Pages
import LandingPage from "../pages/LandingPage"    
import DashboardPage from "../pages/DashboardPage"
import ProgressPage from "../pages/ProgressPage"
import SchedulerPage from "../pages/SchedulerPage"
import AIChatPage from "../pages/AIChatPage"
import ResourcesPage from "../pages/ResourcesPage"
import FeedbackPage from "../pages/FeedbackPage"
import ProfilePage from "../pages/ProfilePage"
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import MentorResourcesPage from "../pages/mentor/MentorResourcesPage"
import MentorProfilePage from "../pages/mentor/MentorProfilePage"
import MentorDashboardPage from "../pages/mentor/MentorDashboardPage"
import NotificationsPage from "../pages/NotificationsPage"
import HelpPage from "../pages/HelpPage"
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage"
import AdminFeedbackDashboard from "../pages/admin/AdminFeedbackDashboard"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public Routes — no login needed ── */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── All logged in users ── */}
        <Route element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>

          {/* Shared pages — all roles */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={["student", "mentor", "admin"]}>
              <DashboardPage />
            </PrivateRoute>
          } />

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

          {/* ── Student only pages ── */}
          <Route path="/scheduler" element={
            <PrivateRoute roles={["student"]}>
              <SchedulerPage />
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

          {/* ── Mentor only pages ── */}
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

          {/* ── Admin only pages ── */}
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

          {/* Placeholder routes — full pages to be built when backend is ready */}
          <Route path="/admin/users"     element={<PrivateRoute roles={["admin"]}><AdminAnalyticsPage /></PrivateRoute>} />
          <Route path="/admin/approvals" element={<PrivateRoute roles={["admin"]}><AdminAnalyticsPage /></PrivateRoute>} />
          <Route path="/admin/system"    element={<PrivateRoute roles={["admin"]}><AdminAnalyticsPage /></PrivateRoute>} />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes