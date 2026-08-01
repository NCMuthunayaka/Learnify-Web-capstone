import { useState, useEffect } from "react"
import { Clock, BookOpen, AlertCircle, CheckCheck, Trash2, Bell, BellRing, Filter } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import Tooltip from "../components/common/Tooltip"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../api/notificationsApi"

const filterTabs = ["All", "Unread", "Deadlines", "Sessions", "Resources", "System"]

// ── Notification Icon ─────────────────────────────────────
function NotificationIcon({ type }) {
  const config = {
    deadline:     { icon: Clock,       bg: "bg-red-100",    color: "text-red-500"    },
    session:      { icon: BookOpen,    bg: "bg-blue-100",   color: "text-blue-500"   },
    resource:     { icon: BookOpen,    bg: "bg-green-100",  color: "text-green-500"  },
    system:       { icon: AlertCircle, bg: "bg-purple-100", color: "text-purple-500" },
    mentor_reply: { icon: AlertCircle, bg: "bg-yellow-100", color: "text-yellow-500" },
    achievement:  { icon: AlertCircle, bg: "bg-pink-100",   color: "text-pink-500"   },
    reminder:     { icon: Clock,       bg: "bg-orange-100", color: "text-orange-500" },
    approval:     { icon: CheckCheck,  bg: "bg-emerald-100",color: "text-emerald-500"},
  }
  const { icon: Icon, bg, color } = config[type] || config.system
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <Icon size={18} className={color} />
    </div>
  )
}

// ── Format time ───────────────────────────────────────────
function formatTime(isoString) {
  const date     = new Date(isoString)
  const now      = new Date()
  const diffMs   = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs  = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)   return "Just now"
  if (diffMins < 60)  return `${diffMins} min ago`
  if (diffHrs  < 24)  return `${diffHrs} hr ago`
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

// ── Group by date — fixed order ───────────────────────────
const GROUP_ORDER = ["Today", "Yesterday", "Earlier"]

function getDateGroup(isoString) {
  const diffDays = Math.floor((new Date() - new Date(isoString)) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return "Earlier"
}

// ── Main Component ────────────────────────────────────────
function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")
  const [activeFilter, setActiveFilter]   = useState("All")

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      setError("")
      const response = await getNotifications()
      setNotifications(response.data.notifications || [])
    } catch (err) {
      setError("Failed to load notifications. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Filter ─────────────────────────────────────────────
  function getFiltered() {
    switch (activeFilter) {
      case "Unread":    return notifications.filter(n => !n.is_read)
      case "Deadlines": return notifications.filter(n => n.type === "deadline")
      case "Sessions":  return notifications.filter(n => n.type === "session")
      case "Resources": return notifications.filter(n => n.type === "resource")
      case "System":    return notifications.filter(n => n.type === "system")
      default:          return notifications
    }
  }

  // ── Count per filter tab ───────────────────────────────
  function getTabCount(tab) {
    switch (tab) {
      case "Unread":    return notifications.filter(n => !n.is_read).length
      case "Deadlines": return notifications.filter(n => n.type === "deadline").length
      case "Sessions":  return notifications.filter(n => n.type === "session").length
      case "Resources": return notifications.filter(n => n.type === "resource").length
      case "System":    return notifications.filter(n => n.type === "system").length
      default:          return notifications.length
    }
  }

  async function handleMarkRead(notification) {
    if (!notification.is_read) {
      markAsRead(notification.id).catch(() => {})
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ))
    }

    if (notification.action_url) {
      const targetUrl = notification.action_url === "/help" ? "/community" : notification.action_url
      navigate(targetUrl)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  // ── Group with fixed order ─────────────────────────────
  const filtered = getFiltered()
  const groupMap = filtered.reduce((acc, n) => {
    const group = getDateGroup(n.created_at)
    if (!acc[group]) acc[group] = []
    acc[group].push(n)
    return acc
  }, {})

  const grouped = GROUP_ORDER
    .filter(g => groupMap[g]?.length > 0)
    .map(g => [g, groupMap[g]])

  const hasNoNotifications = notifications.length === 0
  const hasNoResults       = filtered.length === 0 && notifications.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading notifications..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* ── Hero Header Banner ── */}
        <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3D63] rounded-3xl px-8 py-7 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow">
              {unreadCount > 0
                ? <BellRing size={24} className="text-amber-300 animate-pulse" />
                : <Bell size={24} className="text-white/70" />
              }
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-white">Notifications</h1>
              <p className="font-body text-xs text-gray-300 mt-0.5">
                {unreadCount > 0
                  ? <span className="text-amber-300 font-semibold">{unreadCount} unread</span>
                  : "All caught up!"}
                {" "}· {notifications.length} total
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-body text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <ErrorMessage message={error} onRetry={fetchNotifications} onDismiss={() => setError("")} />
        )}

        {/* ── Filter Tabs ── */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => {
              const count = getTabCount(tab)
              const isActive = activeFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`font-body text-xs font-medium px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-none ${
                    isActive
                      ? "bg-[#1A3D63] text-white shadow-sm"
                      : "text-gray-500 hover:text-[#1A3D63] hover:bg-gray-50"
                  }`}
                >
                  {tab}
                  {count > 0 && tab !== "All" && (
                    <span className={`font-body text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab === "Unread"
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ── */}
        {hasNoNotifications ? (
          /* Empty — no notifications at all */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-inner">
              <Bell size={28} className="text-gray-300" />
            </div>
            <h3 className="font-heading text-base font-bold text-gray-400">No notifications yet</h3>
            <p className="font-body text-xs text-gray-300 mt-1.5 max-w-xs leading-relaxed">
              You'll be notified about resources, deadlines, sessions, and community activity here.
            </p>
          </div>
        ) : hasNoResults ? (
          /* Empty for current filter */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-inner">
              <Filter size={24} className="text-gray-300" />
            </div>
            <h3 className="font-heading text-base font-bold text-gray-400">
              No {activeFilter.toLowerCase()} notifications
            </h3>
            <button
              onClick={() => setActiveFilter("All")}
              className="font-body text-xs font-semibold text-[#4A7FA7] hover:text-[#1A3D63] mt-4 transition-colors border-none bg-transparent cursor-pointer underline"
            >
              View all notifications
            </button>
          </div>
        ) : (
          /* Notification Groups — in fixed Today → Yesterday → Earlier order */
          <div className="space-y-5">
            {grouped.map(([date, items]) => (
              <div key={date} className="space-y-2">
                {/* Date section label */}
                <p className="font-body text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  {date}
                </p>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 cursor-pointer group ${
                        !notification.is_read ? "bg-blue-50/30" : "bg-white"
                      }`}
                      onClick={() => handleMarkRead(notification)}
                    >
                      <NotificationIcon type={notification.type} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-body text-sm leading-snug ${
                            !notification.is_read
                              ? "font-semibold text-[#0A1931]"
                              : "font-medium text-gray-600"
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <Tooltip text="Delete" position="left">
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="p-1.5 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 border-none cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        <p className="font-body text-xs text-gray-400 mt-0.5 leading-relaxed">
                          {notification.body}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="font-body text-[11px] text-gray-300">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkRead(notification)
                              }}
                              className="font-body text-[11px] font-bold text-[#4A7FA7] hover:text-[#1A3D63] transition-colors border-none bg-transparent cursor-pointer p-0"
                            >
                              View →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default NotificationsPage