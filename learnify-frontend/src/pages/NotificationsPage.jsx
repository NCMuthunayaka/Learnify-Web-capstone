import { useState, useEffect } from "react"
import { Clock, BookOpen, AlertCircle, CheckCheck, Trash2, Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import Badge from "../components/common/Badge"
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
  }
  const { icon: Icon, bg, color } = config[type] || config.system
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center
      justify-center flex-shrink-0`}>
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
    // Navigate to action_url if exists
    if (notification.action_url && !notification.is_read) {
      await markAsRead(notification.id).catch(() => {})
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ))
      navigate(notification.action_url)
      return
    }

    if (notification.is_read) return

    try {
      await markAsRead(notification.id)
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ))
    } catch (err) {
      console.error("Failed to mark as read:", err)
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

  // Always show in Today → Yesterday → Earlier order
  const grouped = GROUP_ORDER
    .filter(g => groupMap[g]?.length > 0)
    .map(g => [g, groupMap[g]])

  const hasNoNotifications = notifications.length === 0
  const hasNoResults       = filtered.length === 0 && notifications.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Loading notifications..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
            Notifications
          </h2>
          <p className="font-body text-sm text-gray-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up! No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" icon={CheckCheck} onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onRetry={fetchNotifications}
          onDismiss={() => setError("")} />
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm
        border border-gray-100 flex flex-wrap gap-1">
        {filterTabs.map((tab) => {
          const count = getTabCount(tab)
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`font-body text-xs font-medium px-4 py-2
                rounded-xl transition-colors duration-200 flex items-center gap-1.5
                ${activeFilter === tab
                  ? "bg-[#1A3D63] text-white"
                  : "text-gray-400 hover:text-[#1A3D63] hover:bg-gray-50"}`}
            >
              {tab}
              {/* Show count badge on tabs that have items */}
              {count > 0 && tab !== "All" && (
                <span className={`font-body text-[10px] font-bold px-1.5 py-0.5
                  rounded-full min-w-[18px] text-center
                  ${activeFilter === tab
                    ? "bg-white/20 text-white"
                    : tab === "Unread"
                    ? "bg-red-100 text-red-500"
                    : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty States */}
      {hasNoNotifications ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm
          border border-gray-100 text-center">
          <Bell size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-heading text-sm font-semibold text-gray-300">
            No notifications yet
          </p>
          <p className="font-body text-xs text-gray-200 mt-1">
            You'll be notified about resources, deadlines and more
          </p>
        </div>
      ) : hasNoResults ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm
          border border-gray-100 text-center">
          <Bell size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-heading text-sm font-semibold text-gray-300">
            No {activeFilter.toLowerCase()} notifications
          </p>
          <button
            onClick={() => setActiveFilter("All")}
            className="font-body text-xs text-[#4A7FA7] hover:text-[#1A3D63]
              mt-3 transition-colors font-medium"
          >
            View all notifications
          </button>
        </div>
      ) : (
        /* Notification Groups — in fixed order */
        grouped.map(([date, items]) => (
          <div key={date} className="space-y-2">
            <p className="font-body text-xs font-semibold text-gray-400
              uppercase tracking-wider px-1">
              {date}
            </p>

            <div className="bg-white rounded-2xl shadow-sm
              border border-gray-100 overflow-hidden">
              {items.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-5 py-4
                    transition-colors hover:bg-gray-50 cursor-pointer
                    ${index !== items.length - 1 ? "border-b border-gray-50" : ""}
                    ${!notification.is_read ? "bg-blue-50/40" : "bg-white"}`}
                  onClick={() => handleMarkRead(notification)}
                >
                  <NotificationIcon type={notification.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-body text-sm leading-tight
                        ${!notification.is_read
                          ? "font-semibold text-[#0A1931]"
                          : "font-medium text-gray-600"}`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500
                            flex-shrink-0" />
                        )}
                        <Tooltip text="Delete" position="left">
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-1 text-gray-200 hover:text-red-400
                              transition-colors rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="font-body text-xs text-gray-400
                      mt-0.5 leading-relaxed">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-body text-[11px] text-gray-300">
                        {formatTime(notification.created_at)}
                      </p>
                      {/* Show clickable link if action_url exists */}
                      {notification.action_url && (
                        <span className="font-body text-[11px] text-[#4A7FA7]
                          hover:text-[#1A3D63]">
                          View →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

    </div>
  )
}

export default NotificationsPage