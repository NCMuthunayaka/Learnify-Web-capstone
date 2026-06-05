import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, CalendarDays, TrendingUp,
  Bot, BookOpen, HelpCircle, User, LogOut, Bell, Users
} from "lucide-react"
import sidebarBg from "../../assets/images/sidebar_img.jpg"
import learnify_logo from "../../assets/images/learnify_logo.png"
import { useAuth } from "../../hooks/useAuth"

const studentNavItems = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/dashboard" },
  { label: "Scheduler",    icon: CalendarDays,    path: "/scheduler"  },
  { label: "Progress",     icon: TrendingUp,      path: "/progress"   },
  { label: "AI Assistant", icon: Bot,             path: "/ai-chat"    },
  { label: "Materials",    icon: BookOpen,        path: "/resources"  },
  { label: "Help",         icon: HelpCircle,      path: "/help"       },
]

const mentorNavItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/mentor/dashboard" },
  { label: "Student Requests", icon: Users,           path: "/mentor/requests"  },
  { label: "Notification",     icon: Bell,            path: "/notifications"    },
  { label: "AI Assistant",     icon: Bot,             path: "/ai-chat"          },
  { label: "Resource",         icon: BookOpen,        path: "/mentor/resources" },
  { label: "Help",             icon: HelpCircle,      path: "/help"             },
]

function Sidebar({ isOpen }) {
  const { user, logout } = useAuth()
  const isMentor = user?.role === "mentor"
  const navItems = isMentor ? mentorNavItems : studentNavItems
  const profilePath = isMentor ? "/mentor/profile" : "/profile"

  return (
    <div
      className={`relative flex flex-col h-screen text-white
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-56" : "w-0 overflow-hidden"}`}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sidebarBg})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0A1931] opacity-75" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5
          border-b border-white/10">
          <div className="w-10 h-10  bg-[#f6fafd] rounded-lg flex items-center
            justify-center">
            <img src={learnify_logo} alt="Learnify Logo" />
          </div>
          {isOpen && (
            <span className="font-semibold text-lg">Learnify</span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-200
                ${isActive
                  ? "bg-white/20 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <NavLink
            to={profilePath}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              transition-all duration-200
              ${isActive
                ? "bg-white/20 text-white font-medium"
                : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <User size={18} />
            <span>Profile</span>
          </NavLink>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-lg text-sm text-red-400 hover:bg-white/10
              hover:text-red-300 transition-all duration-200 text-left"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default Sidebar