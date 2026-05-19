import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import LandingLayout from "../components/layout/LandingLayout"
import AuthLayout from "../components/layout/AuthLayout"
import PrivateRoute from "./PrivateRoute"

// Pages
import LandingPage from "../pages/LandingPage"    
import DashboardPage from "../pages/DashboardPage"
import SchedulerPage from "../pages/SchedulerPage"
import AIChatPage from "../pages/AIChatPage"
import ResourcesPage from "../pages/ResourcesPage"
import FeedbackPage from "../pages/FeedbackPage"
import ProfilePage from "../pages/ProfilePage"
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page Routes — Light theme */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Routes — Dark theme with sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/scheduler" element={<PrivateRoute><SchedulerPage /></PrivateRoute>} />
          <Route path="/ai-chat" element={<PrivateRoute><AIChatPage /></PrivateRoute>} />
          <Route path="/resources" element={<PrivateRoute><ResourcesPage /></PrivateRoute>} />
          <Route path="/feedback" element={<PrivateRoute><FeedbackPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes