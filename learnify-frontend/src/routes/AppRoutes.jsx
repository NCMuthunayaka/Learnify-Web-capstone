import { BrowserRouter, Routes, Route } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import LandingLayout from "../components/layout/LandingLayout"

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

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page Routes — Light theme */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} /> 
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Routes — Dark theme with sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/mentor/dashboard" element={<MentorDashboardPage />} />
          <Route path="/mentor/requests" element={<MentorDashboardPage />} />
          <Route path="/mentor/resources" element={<MentorResourcesPage />} />
          <Route path="/mentor/profile" element={<MentorProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes