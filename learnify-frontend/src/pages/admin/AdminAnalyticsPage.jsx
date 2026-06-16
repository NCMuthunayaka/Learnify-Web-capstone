import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, GraduationCap, UserCheck, AlertCircle,
  Edit3, Ban, TrendingUp, Activity, Download, ChevronRight
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts"
import { useAuth } from "../../hooks/useAuth"
import { getAdminStats, getPlatformAnalytics } from "../../api/adminApi"

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs font-body">
        <p className="font-bold text-[#0A1931]">{label}</p>
        <p className="text-[#4A7FA7]">{payload[0].value} registrations</p>
      </div>
    )
  }
  return null
}

function CircularGauge({ percent }) {
  const r    = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke="#0A1931"
        strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text
        x="70" y="65"
        textAnchor="middle"
        style={{ fontSize: 22, fontWeight: 800, fill: "#0A1931", fontFamily: "inherit" }}
      >
        {percent}%
      </text>
      <text
        x="70" y="83"
        textAnchor="middle"
        style={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600, letterSpacing: 1, fontFamily: "inherit" }}
      >
        ACTIVE RATE
      </text>
    </svg>
  )
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-green-500",
]

export default function AdminAnalyticsPage() {
  const navigate    = useNavigate()
  const [activeBar, setActiveBar] = useState(null)
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getAdminStats(), getPlatformAnalytics()])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data)
        setAnalytics(analyticsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statsCards = stats ? [
    {
      label: "Total Users",
      value: stats.total_users?.toLocaleString() ?? "—",
      change: `${stats.students} students`,
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
      changeBg: "text-green-600 bg-green-50",
    },
    {
      label: "Students",
      value: stats.students?.toLocaleString() ?? "—",
      change: "Enrolled",
      icon: GraduationCap,
      iconBg: "bg-indigo-50 text-indigo-600",
      changeBg: "text-green-600 bg-green-50",
    },
    {
      label: "Mentors",
      value: stats.mentors?.toLocaleString() ?? "—",
      change: "Registered",
      icon: UserCheck,
      iconBg: "bg-teal-50 text-teal-600",
      changeBg: "text-green-600 bg-green-50",
    },
    {
      label: "Active Requests",
      value: stats.pending_approvals?.toLocaleString() ?? "—",
      badge: stats.pending_approvals > 0 ? "URGENT" : null,
      icon: AlertCircle,
      iconBg: "bg-red-50 text-red-600",
      changeBg: "text-red-600 bg-red-50",
    },
  ] : []

  const recentUsers      = analytics?.recent_users      ?? []
  const growthData       = analytics?.growth_data       ?? []
  const mentorPerformance = analytics?.mentor_performance ?? []
  const activeRate = stats ? Math.round((stats.active_users / Math.max(stats.total_users, 1)) * 100) : 0

  const systemResources = [
    { label: "USERS",   value: activeRate, color: "text-blue-600",  bar: "bg-blue-500" },
    { label: "MENTORS", value: stats ? Math.round((stats.mentors  / Math.max(stats.total_users, 1)) * 100) : 0, color: "text-green-600", bar: "bg-green-500" },
    { label: "PENDING", value: stats ? Math.round((stats.pending_approvals / Math.max(stats.total_users, 1)) * 100) : 0, color: "text-red-600",   bar: "bg-red-500"   },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── 1. Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
                flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-heading text-xl font-extrabold text-[#0A1931]">
                    {card.value}
                  </span>
                  {card.badge ? (
                    <span className={`font-body text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${card.changeBg}`}>
                      {card.badge}
                    </span>
                  ) : (
                    <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${card.changeBg}`}>
                      {card.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 2. User Management Table + Platform Growth ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Users */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
            <h2 className="font-heading text-base font-bold text-[#0A1931]">Recent Users</h2>
            <button
              onClick={() => navigate("/admin/users")}
              className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63]
                flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Name", "Email Address", "Role", "Status", "Actions"].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left font-body text-[10px] text-gray-400
                      uppercase tracking-wider font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.map((u, i) => {
                const initials = u.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"
                const color    = AVATAR_COLORS[i % AVATAR_COLORS.length]
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${color} text-white
                          text-xs font-bold font-heading flex items-center justify-center flex-shrink-0`}>
                          {initials}
                        </div>
                        <span className="font-body text-sm font-semibold text-[#0A1931]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`font-body text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                        u.role === "mentor"
                          ? "bg-[#0A1931] text-white"
                          : u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.status === "active" ? "bg-green-500" :
                          u.status === "pending" ? "bg-amber-400" : "bg-gray-300"
                        }`} />
                        <span className={`font-body text-xs font-medium ${
                          u.status === "active" ? "text-green-600" :
                          u.status === "pending" ? "text-amber-600" : "text-gray-400"
                        }`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate("/admin/users")}
                          className="w-7 h-7 rounded-lg border border-gray-100 flex items-center justify-center
                            text-gray-400 hover:text-[#4A7FA7] hover:border-[#4A7FA7] transition-colors"
                          title="Edit user"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg border border-gray-100 flex items-center justify-center
                            text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          title="Suspend user"
                        >
                          <Ban size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center font-body text-sm text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Platform Growth Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-heading text-base font-bold text-[#0A1931]">Platform Growth</h2>
            <TrendingUp size={18} className="text-[#4A7FA7]" />
          </div>
          <p className="font-body text-xs text-gray-400 mb-5">Daily new registrations (last 7 days)</p>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={growthData}
                barCategoryGap="30%"
                onMouseLeave={() => setActiveBar(null)}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  onMouseEnter={(_, index) => setActiveBar(index)}
                >
                  {growthData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={activeBar === index ? "#4A7FA7" : "#0A1931"}
                      opacity={activeBar !== null && activeBar !== index ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
            <div className="flex items-center justify-between font-body text-xs">
              <span className="font-semibold text-gray-600">Active User Rate</span>
              <span className="font-bold text-[#0A1931]">{activeRate}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#0A1931] rounded-full transition-all duration-500" style={{ width: `${activeRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. System Resources + Mentor Performance ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* System Resources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="mb-4 border-b border-gray-50 pb-4">
            <h2 className="font-heading text-sm font-bold text-[#0A1931]">User Distribution</h2>
            <p className="font-body text-[10px] text-gray-400 mt-0.5">Breakdown of platform user roles</p>
          </div>

          <div className="flex flex-col items-center flex-1">
            <CircularGauge percent={activeRate} />

            <div className="grid grid-cols-3 gap-3 w-full mt-4">
              {systemResources.map((res) => (
                <div key={res.label} className="text-center">
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${res.bar} transition-all duration-500`}
                      style={{ width: `${res.value}%` }}
                    />
                  </div>
                  <p className={`font-heading text-sm font-extrabold ${res.color}`}>{res.value}%</p>
                  <p className="font-body text-[9px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                    {res.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mentor Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
            <h2 className="font-heading text-sm font-bold text-[#0A1931]">Mentor Performance</h2>
            <Activity size={16} className="text-[#4A7FA7]" />
          </div>

          <div className="space-y-4 flex-1">
            {mentorPerformance.length > 0 ? mentorPerformance.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs font-bold
                  font-heading flex items-center justify-center flex-shrink-0`}>
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs font-semibold text-[#0A1931] truncate">
                      {m.name}
                    </span>
                    <span className="font-heading text-xs font-bold text-[#4A7FA7] ml-2 flex-shrink-0">
                      {m.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} transition-all duration-500`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <p className="font-body text-sm text-gray-400 text-center py-8">
                No mentor feedback data yet.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/admin/users")}
            className="mt-5 w-full border border-gray-200 text-[#0A1931] font-body text-xs font-semibold
              py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={13} />
            View Full User Report
          </button>
        </div>
      </div>

    </div>
  )
}
