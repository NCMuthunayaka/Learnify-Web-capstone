import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, CalendarDays, TrendingUp,
  Bot, BookOpen, HelpCircle, User, LogOut,
  Users, UserCheck, Monitor, MessageSquare, Settings
} from "lucide-react"
import sidebarBg from "../../assets/images/sidebar_img.jpg"
import learnifyLogo from "../../assets/images/learnify_logo.png"


// ── Nav items for each role ───────────────────────────────
const studentNavItems = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/dashboard" },
  { label: "Scheduler",    icon: CalendarDays,    path: "/scheduler"  },
  { label: "Progress",     icon: TrendingUp,      path: "/progress"   },
  { label: "AI Assistant", icon: Bot,             path: "/ai-chat"    },
  { label: "Materials",    icon: BookOpen,        path: "/resources"  },
  { label: "Help",         icon: HelpCircle,      path: "/help"       },
]

const mentorNavItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/dashboard" },
  { label: "Student Requests", icon: MessageSquare,   path: "/mentor/requests"  },
  { label: "AI Assistant",     icon: Bot,             path: "/ai-chat"          },
  { label: "My Resources",     icon: BookOpen,        path: "/mentor/resources" },
  { label: "Help",             icon: HelpCircle,      path: "/help"             },
]

const adminNavItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management",  icon: Users,           path: "/admin/users"     },
  { label: "User Approvals",   icon: UserCheck,       path: "/admin/approvals" },
  { label: "System Monitoring",icon: Monitor,         path: "/admin/system"    },
  { label: "Feedback",         icon: MessageSquare,   path: "/admin/feedback"  },
]

// ── Get role from JWT token ───────────────────────────────
function getRoleFromToken() {
  try {
    const token = localStorage.getItem("access_token")
    if (!token) return "student"
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || "student"
  } catch {
    return "student"
  }
}

function Sidebar({ isOpen }) {
  const navigate = useNavigate()
  const role     = getRoleFromToken()

  // Pick correct nav items based on role
  const navItems =
    role === "admin"  ? adminNavItems  :
    role === "mentor" ? mentorNavItems :
    studentNavItems

  // Pick correct profile path based on role
  const profilePath =
    role === "admin"  ? "/admin/profile"  :
    role === "mentor" ? "/mentor/profile" :
    "/profile"

  function handleLogout() {
    localStorage.clear()
    navigate("/login")
  }

  return (
    <div
      className={`relative flex flex-col h-screen text-white
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-56" : "w-0 overflow-hidden"}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sidebarBg})` }}
      />
      <div className="absolute inset-0 bg-[#0A1931] opacity-75" />

      <div className="relative z-10 flex flex-col h-full">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5
          border-b border-white/10">
          <img
            src={learnifyLogo}
            alt="Learnify Logo"
            className="w-10 h-10 object-contain"
          />
          {isOpen && (
            <span className="font-semibold text-lg">Learnify</span>
          )}
        </div>

        {/* Nav Links — different per role */}
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

        {/* Bottom — Profile & Logout */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">

          {/* Bottom link: Settings for admin, Profile for others */}
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
            {role === "admin" ? <Settings size={18} /> : <User size={18} />}
            <span>{role === "admin" ? "Settings" : "Profile"}</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-lg text-sm text-red-400 hover:bg-white/10
              hover:text-red-300 transition-all duration-200"
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