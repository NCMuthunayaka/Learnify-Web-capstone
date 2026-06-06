import { useState, useEffect } from "react"
import { Clock, BookOpen, AlertCircle, CheckCheck, Trash2, Bell } from "lucide-react"
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
    deadline:     { icon: Clock,        bg: "bg-red-100",    color: "text-red-500"    },
    session:      { icon: BookOpen,     bg: "bg-blue-100",   color: "text-blue-500"   },
    resource:     { icon: BookOpen,     bg: "bg-green-100",  color: "text-green-500"  },
    system:       { icon: AlertCircle,  bg: "bg-purple-100", color: "text-purple-500" },
    mentor_reply: { icon: AlertCircle,  bg: "bg-yellow-100", color: "text-yellow-500" },
    achievement:  { icon: AlertCircle,  bg: "bg-pink-100",   color: "text-pink-500"   },
    reminder:     { icon: Clock,        bg: "bg-orange-100", color: "text-orange-500" },
  }
  const { icon: Icon, bg, color } = config[type] || config.system
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center
      justify-center flex-shrink-0`}>
      <Icon size={18} className={color} />
    </div>
  )
}

// ── Format time helper ────────────────────────────────────
function formatTime(isoString) {
  const date  = new Date(isoString)
  const now   = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs  = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)   return "Just now"
  if (diffMins < 60)  return `${diffMins} min ago`
  if (diffHrs  < 24)  return `${diffHrs} hr ago`
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short"
  })
}

// ── Group by date helper ──────────────────────────────────
function getDateGroup(isoString) {
  const date  = new Date(isoString)
  const now   = new Date()
  const diffDays = Math.floor((now - date) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return "Earlier"
}

// ── Main Component ────────────────────────────────────────
function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")
  const [activeFilter, setActiveFilter]   = useState("All")

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── Fetch notifications from backend ──────────────────
  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      setError("")
      const response = await getNotifications()
      // Backend returns { notifications, unread_count }
      setNotifications(response.data.notifications || [])
    } catch (err) {
      setError("Failed to load notifications. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Filter logic ───────────────────────────────────────
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

  // ── Mark one as read ───────────────────────────────────
  async function handleMarkRead(id) {
    try {
      await markAsRead(id)
      // Update local state — no need to refetch
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  // ── Mark all as read ───────────────────────────────────
  async function handleMarkAllRead() {
    try {
      await markAllAsRead()
      // Update all local notifications
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  // ── Delete notification ────────────────────────────────
  async function handleDelete(id) {
    try {
      await deleteNotification(id)
      // Remove from local state — no need to refetch
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {
      console.error("Failed to delete notification:", err)
    }
  }

  // ── Group by date ──────────────────────────────────────
  const filtered = getFiltered()
  const grouped  = filtered.reduce((acc, n) => {
    const group = getDateGroup(n.created_at)
    if (!acc[group]) acc[group] = []
    acc[group].push(n)
    return acc
  }, {})

  // ── Loading state ──────────────────────────────────────
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
              ? `You have ${unreadCount} unread notifications`
              : "All caught up! No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchNotifications}
          onDismiss={() => setError("")}
        />
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm
        border border-gray-100 flex flex-wrap gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`font-body text-xs font-medium px-4 py-2
              rounded-xl transition-colors duration-200
              ${activeFilter === tab
                ? "bg-[#1A3D63] text-white"
                : "text-gray-400 hover:text-[#1A3D63] hover:bg-gray-50"}`}
          >
            {tab}
            {tab === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex">
                <Badge
                  variant={activeFilter === tab ? "primary" : "danger"}
                  size="sm"
                >
                  {unreadCount}
                </Badge>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm
          border border-gray-100 text-center">
          <Bell size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-heading text-sm font-semibold text-gray-300">
            No notifications found
          </p>
          <p className="font-body text-xs text-gray-200 mt-1">
            Try a different filter
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
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
                  onClick={() => handleMarkRead(notification.id)}
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
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        <Tooltip text="Delete" position="left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            className="p-1 text-gray-200 hover:text-red-400
                              transition-colors rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    {/* body from backend instead of message */}
                    <p className="font-body text-xs text-gray-400
                      mt-0.5 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="font-body text-[11px] text-gray-300 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
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