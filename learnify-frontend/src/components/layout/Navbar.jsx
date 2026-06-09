import { useState, useRef, useEffect } from "react"
import { Menu, Bell, CheckCheck, Clock, BookOpen, AlertCircle, User, LogOut } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import Avatar from "../common/Avatar"
import Tooltip from "../common/Tooltip"
import Badge from "../common/Badge"
import { useAuth } from "../../hooks/useAuth"
import profileImg from "../../assets/icons/profile.png"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../api/notificationsApi"
import api from "../../api/axiosInstance"

const pageTitles = {
  "/dashboard": "Dashboard",
  "/scheduler": "Study Scheduler",
  "/progress": "Progress",
  "/ai-chat": "AI Assistant",
  "/resources": "Study Resources",
  "/feedback": "Feedback",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/mentor/resources": "My Resources",
  "/mentor/profile":   "My Profile",
  "/help":             "Help Requests",
}

// ── Notification Icon ─────────────────────────────────────
function NotificationIcon({ type }) {
  const config = {
    deadline: { icon: Clock, bg: "bg-red-100", color: "text-red-500" },
    session: { icon: BookOpen, bg: "bg-blue-100", color: "text-blue-500" },
    resource: { icon: BookOpen, bg: "bg-green-100", color: "text-green-500" },
    system: { icon: AlertCircle, bg: "bg-purple-100", color: "text-purple-500" },
    mentor_reply: { icon: AlertCircle, bg: "bg-yellow-100", color: "text-yellow-500" },
    reminder: { icon: Clock, bg: "bg-orange-100", color: "text-orange-500" },
  }
  const { icon: Icon, bg, color } = config[type] || config.system
  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center
      justify-center flex-shrink-0`}>
      <Icon size={14} className={color} />
    </div>
  )
}

function Navbar({ onToggleSidebar }) {
  const { logout } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  const pageTitle   = pageTitles[location.pathname] || "Dashboard"
  const dropdownRef = useRef(null)
  const profileDropdownRef = useRef(null)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [showDropdown, setShowDropdown]   = useState(false)
  const [showProfileCard, setShowProfileCard] = useState(false)
  const [user, setUser]                   = useState({ name: "", role: "", email: "" })

  const profilePath = user?.role === "mentor" ? "/mentor/profile" : "/profile"

  // ── Fetch notifications and user on mount ────────────────
  useEffect(() => {
    fetchNotifications()
    fetchUser()
  }, [])

  async function fetchNotifications() {
    try {
      const response = await getNotifications()
      const data = response.data
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  async function fetchUser() {
    try {
      // Get user from localStorage token
      const token = localStorage.getItem("access_token")
      if (!token) return

      // Decode JWT payload to get user info
      const { default: api } = await import("../../api/axiosInstance")
      const response = await api.get("/auth/me")

      // Our Flask API wraps data in { success, message, data }
      // Axios wraps response in response.data
      // So real user is at response.data.data
      const userData = response.data.data
      setUser(userData)

    } catch (err) {
      console.error("Failed to fetch user:", err)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileCard(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleMarkAllRead() {
    try {
      await markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  async function handleMarkRead(id) {
    try {
      await markAsRead(id)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4
      bg-[#0A1931] border-b border-white/10 text-white">

      {/* Left */}
      <div className="flex items-center gap-4">
        <Tooltip text="Toggle Sidebar" position="bottom">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
        </Tooltip>
        <h1 className="font-heading font-semibold text-lg text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <Tooltip text="Notifications" position="bottom">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4
                  bg-red-500 rounded-full flex items-center justify-center
                  font-body text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-white
              rounded-2xl shadow-2xl border border-gray-100 z-50
              overflow-hidden">

              <div className="flex items-center justify-between
                px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-semibold
                    text-[#0A1931]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">{unreadCount}</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 font-body text-xs
                      text-[#4A7FA7] hover:text-[#1A3D63] transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                    <p className="font-body text-xs text-gray-300">
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkRead(notification.id)}
                      className={`flex items-start gap-3 px-4 py-3
                        border-b border-gray-50 cursor-pointer
                        hover:bg-gray-50 transition-colors
                        ${!notification.is_read ? "bg-blue-50/50" : "bg-white"}`}
                    >
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-body text-xs leading-tight
                            ${!notification.is_read
                              ? "font-semibold text-[#0A1931]"
                              : "font-medium text-gray-600"}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full
                              bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="font-body text-[11px] text-gray-400
                          mt-0.5 leading-tight">
                          {notification.body}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate("/notifications")
                  }}
                  className="font-body text-xs text-[#4A7FA7]
                    hover:text-[#1A3D63] transition-colors font-medium"
                >
                  View all notifications
                </button>
              </div>

            </div>
          )}
        </div>

        {/* User / Profile Card Trigger */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileCard(!showProfileCard)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors focus:outline-none text-left"
          >
            <div className="text-right hidden sm:block">
              <p className="font-body text-sm font-medium text-white leading-tight">
                {user.name || "User"}
              </p>
              <p className="font-body text-[11px] text-[#B3CFE5] mt-0.5 capitalize">
                {user.role || "Student"}
              </p>
            </div>
            <Avatar src={profileImg} name={user.name || "U"} color="accent" size="md" />
          </button>

          {/* Profile Card Dropdown */}
          {showProfileCard && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 overflow-hidden text-[#0A1931]">
              {/* Profile Card Header */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <Avatar src={profileImg} name={user.name || "U"} color="accent" size="lg" />
                <h4 className="font-heading font-bold text-base mt-3 leading-tight">
                  {user.name || "User"}
                </h4>
                <span className="font-body text-xs text-gray-400 mt-0.5">
                  {user.email || "user@learnify.com"}
                </span>
                <span className="mt-2.5 px-3 py-1 bg-[#F6FAFD] border border-[#B3CFE5]/30 rounded-full font-body text-[11px] font-semibold text-[#1A3D63] uppercase tracking-wider">
                  {user.role || "student"}
                </span>
              </div>

              {/* Profile Card Menu */}
              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileCard(false)
                    navigate(profilePath)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-body text-gray-600 hover:bg-gray-50 hover:text-[#1A3D63] transition-colors text-left"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileCard(false)
                    navigate("/notifications")
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-body text-gray-600 hover:bg-gray-50 hover:text-[#1A3D63] transition-colors text-left"
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </button>
              </div>

              {/* Divider and Logout */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowProfileCard(false)
                    logout()
                    navigate("/login")
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-body text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left font-medium"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

export default Navbar