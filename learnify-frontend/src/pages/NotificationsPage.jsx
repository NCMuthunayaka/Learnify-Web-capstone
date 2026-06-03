import { useState } from "react"
import { Clock, BookOpen, AlertCircle, CheckCheck, Trash2, Bell } from "lucide-react"
import Button from "../components/common/Button"
import Badge from "../components/common/Badge"
import Tooltip from "../components/common/Tooltip" 

const initialNotifications = [
  { id: 1, type: "deadline", title: "Mathematics Mock Exam",   message: "Due in 3 days — Chapter 7: Statistics",              time: "2 min ago",  date: "Today",     read: false },
  { id: 2, type: "session",  title: "Study Session Starting",  message: "Physics — Thermodynamics starts in 30 minutes",       time: "25 min ago", date: "Today",     read: false },
  { id: 3, type: "resource", title: "New Resource Uploaded",   message: "Mr. Fernando uploaded Organic Chemistry notes",       time: "1 hr ago",   date: "Today",     read: false },
  { id: 4, type: "system",   title: "Schedule Generated",      message: "Your weekly timetable has been auto-generated successfully", time: "3 hrs ago", date: "Today",  read: true  },
  { id: 5, type: "deadline", title: "Physics Assignment",      message: "Due in 5 days — Thermodynamics report",               time: "5 hrs ago",  date: "Today",     read: true  },
  { id: 6, type: "resource", title: "New Resource Uploaded",   message: "Ms. Wijesinghe uploaded Essay Writing Techniques notes", time: "Yesterday", date: "Yesterday", read: true },
  { id: 7, type: "session",  title: "Session Completed",       message: "You completed Chemistry — Organic Lab session",       time: "Yesterday",  date: "Yesterday", read: true  },
  { id: 8, type: "system",   title: "Profile Updated",         message: "Your profile information has been updated successfully", time: "2 days ago", date: "Earlier",  read: true  },
]

const filterTabs = ["All", "Unread", "Deadlines", "Sessions", "Resources", "System"]

function NotificationIcon({ type }) {
  const config = {
    deadline: { icon: Clock,        bg: "bg-red-100",    color: "text-red-500"    },
    session:  { icon: BookOpen,     bg: "bg-blue-100",   color: "text-blue-500"   },
    resource: { icon: BookOpen,     bg: "bg-green-100",  color: "text-green-500"  },
    system:   { icon: AlertCircle,  bg: "bg-purple-100", color: "text-purple-500" },
  }
  const { icon: Icon, bg, color } = config[type] || config.system
  return (
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center
      justify-center flex-shrink-0`}>
      <Icon size={18} className={color} />
    </div>
  )
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [activeFilter, setActiveFilter]   = useState("All")

  const unreadCount = notifications.filter(n => !n.read).length

  function getFiltered() {
    switch (activeFilter) {
      case "Unread":    return notifications.filter(n => !n.read)
      case "Deadlines": return notifications.filter(n => n.type === "deadline")
      case "Sessions":  return notifications.filter(n => n.type === "session")
      case "Resources": return notifications.filter(n => n.type === "resource")
      case "System":    return notifications.filter(n => n.type === "system")
      default:          return notifications
    }
  }

  function handleMarkAllRead() {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  function handleMarkRead(id) {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  function handleDelete(id) {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filtered = getFiltered()
  const grouped  = filtered.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = []
    acc[n.date].push(n)
    return acc
  }, {})

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
            {/* 👇 replaced span with Badge */}
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
                    ${!notification.read ? "bg-blue-50/40" : "bg-white"}`}
                  onClick={() => handleMarkRead(notification.id)}
                >

                  <NotificationIcon type={notification.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-body text-sm leading-tight
                        ${!notification.read
                          ? "font-semibold text-[#0A1931]"
                          : "font-medium text-gray-600"}`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        {/* 👇 wrapped with Tooltip */}
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
                    <p className="font-body text-xs text-gray-400
                      mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="font-body text-[11px] text-gray-300 mt-1">
                      {notification.time}
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