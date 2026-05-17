import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import LandingLayout from "../components/layout/LandingLayout"

// Pages — Temporary placeholder pages
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
          <Route path="/" element={<div className="p-10 text-center text-2xl font-bold text-[#1A3D63]">Landing Page Coming Soon</div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Dashboard Routes — Dark theme with sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes