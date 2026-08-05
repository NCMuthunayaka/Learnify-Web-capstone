import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminFeedbackDashboard from '../pages/admin/AdminFeedbackDashboard';
import AIChatPage from '../pages/AIChatPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import FeedbackPage from '../pages/FeedbackPage';
import ProfilePage from '../pages/ProfilePage';
import ResourcesPage from '../pages/ResourcesPage';
import SchedulerPage from '../pages/SchedulerPage';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<AIChatPage />} />
        <Route path="/scheduler" element={<SchedulerPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/feedback" element={<AdminFeedbackDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Router>
);

export default AppRoutes;
