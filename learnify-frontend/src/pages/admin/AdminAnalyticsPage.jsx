import { useState } from "react"
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

// ── Static data (replace with API calls once backend routes are ready) ──

const statsCards = [
  {
    label: "Total Users",
    value: "12,482",
    change: "+12%",
    icon: Users,
    iconBg: "bg-blue-50 text-blue-600",
    changeBg: "text-green-600 bg-green-50",
  },
  {
    label: "Students",
    value: "10,120",
    change: "+4.2%",
    icon: GraduationCap,
    iconBg: "bg-indigo-50 text-indigo-600",
    changeBg: "text-green-600 bg-green-50",
  },
  {
    label: "Mentors",
    value: "2,450",
    change: "+8.2%",
    icon: UserCheck,
    iconBg: "bg-teal-50 text-teal-600",
    changeBg: "text-green-600 bg-green-50",
  },
  {
    label: "Active Requests",
    value: "272",
    badge: "URGENT",
    icon: AlertCircle,
    iconBg: "bg-red-50 text-red-600",
    changeBg: "text-red-600 bg-red-50",
  },
]

const recentUsers = [
  { name: "Sarah Jenkins",   email: "sarah.j@edu.com",   role: "MENTOR",  status: "Active",  initials: "SJ" },
  { name: "Marcus Thorne",   email: "m.thorne@learn.io", role: "STUDENT", status: "Pending", initials: "MT" },
  { name: "Elena Rodriguez", email: "e.rod@academy.org", role: "MENTOR",  status: "Active",  initials: "ER" },
]

const growthData = [
  { day: "MON", value: 42 },
  { day: "TUE", value: 68 },
  { day: "WED", value: 95 },
  { day: "THU", value: 62 },
  { day: "FRI", value: 78 },
  { day: "SAT", value: 55 },
]

const platformEvents = [
  {
    color: "bg-blue-500",
    title: "New mentor onboarded",
    desc: "Dr. Sarah Khan joined Computer Science",
    time: "2 MINUTES AGO",
    isAlert: false,
  },
  {
    color: "bg-green-500",
    title: "Course accreditation approved",
    desc: '"Advanced AI Ethics" moved to active status',
    time: "45 MINUTES AGO",
    isAlert: false,
  },
  {
    color: "bg-red-500",
    title: "Security Alert",
    desc: "Multiple failed login attempts from IP: 192.168.1.1",
    time: "1 HOUR AGO",
    isAlert: true,
  },
  {
    color: "bg-gray-400",
    title: "System Maintenance",
    desc: "Weekly database optimization completed",
    time: "3 HOURS AGO",
    isAlert: false,
  },
]

const mentorPerformance = [
  { name: "Prof. David Chen", score: 98, initials: "DC", color: "bg-blue-500" },
  { name: "Dr. Aisha Khan",   score: 94, initials: "AK", color: "bg-teal-500" },
  { name: "Michael Scott",    score: 89, initials: "MS", color: "bg-purple-500" },
  { name: "Sarah Palmer",     score: 82, initials: "SP", color: "bg-amber-500" },
]

const systemResources = [
  { label: "CPU",      value: 64, color: "text-blue-600",  bar: "bg-blue-500" },
  { label: "STORAGE",  value: 41, color: "text-green-600", bar: "bg-green-500" },
  { label: "AI USAGE", value: 92, color: "text-red-600",   bar: "bg-red-500" },
]

// ── Recharts custom tooltip ──
function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs font-body">
        <p className="font-bold text-[#0A1931]">{label}</p>
        <p className="text-[#4A7FA7]">{payload[0].value} sessions</p>
      </div>
    )
  }
  return null
}

// ── SVG circular gauge ──
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
        TOTAL LOAD
      </text>
    </svg>
  )
}

export default function AdminAnalyticsPage() {
  const navigate    = useNavigate()
  const [activeBar, setActiveBar] = useState(null)

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

        {/* User Management */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
            <h2 className="font-heading text-base font-bold text-[#0A1931]">User Management</h2>
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
              {recentUsers.map((u) => (
                <tr key={u.email} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EBF3F9] text-[#1A3D63]
                        text-xs font-bold font-heading flex items-center justify-center flex-shrink-0">
                        {u.initials}
                      </div>
                      <span className="font-body text-sm font-semibold text-[#0A1931]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                      u.role === "MENTOR"
                        ? "bg-[#0A1931] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        u.status === "Active" ? "bg-green-500" : "bg-amber-400"
                      }`} />
                      <span className={`font-body text-xs font-medium ${
                        u.status === "Active" ? "text-green-600" : "text-amber-600"
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Platform Growth Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-heading text-base font-bold text-[#0A1931]">Platform Growth</h2>
            <TrendingUp size={18} className="text-[#4A7FA7]" />
          </div>
          <p className="font-body text-xs text-gray-400 mb-5">Daily student engagement trends</p>

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
              <span className="font-semibold text-gray-600">Weekly Goal</span>
              <span className="font-bold text-[#0A1931]">82%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#0A1931] rounded-full" style={{ width: "82%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Events + System Resources + Mentor Performance ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Recent Platform Events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
            <h2 className="font-heading text-sm font-bold text-[#0A1931]">Recent Platform Events</h2>
            <Activity size={16} className="text-[#4A7FA7]" />
          </div>
          <div className="space-y-4">
            {platformEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${ev.color}`} />
                  {i < platformEvents.length - 1 && (
                    <span className="w-px h-5 bg-gray-100" />
                  )}
                </div>
                <div className="min-w-0 -mt-0.5">
                  <p className={`font-body text-xs font-semibold leading-snug ${
                    ev.isAlert ? "text-red-600" : "text-[#0A1931]"
                  }`}>
                    {ev.title}
                  </p>
                  <p className="font-body text-[10px] text-gray-400 mt-0.5 leading-relaxed">{ev.desc}</p>
                  <p className="font-body text-[9px] text-gray-300 mt-1 uppercase tracking-wide font-semibold">
                    {ev.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="mb-4 border-b border-gray-50 pb-4">
            <h2 className="font-heading text-sm font-bold text-[#0A1931]">System Resources</h2>
            <p className="font-body text-[10px] text-gray-400 mt-0.5">Real-time hardware utilization</p>
          </div>

          <div className="flex flex-col items-center flex-1">
            <CircularGauge percent={82} />

            <div className="grid grid-cols-3 gap-3 w-full mt-4">
              {systemResources.map((res) => (
                <div key={res.label} className="text-center">
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${res.bar}`}
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
          </div>

          <div className="space-y-4 flex-1">
            {mentorPerformance.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${m.color} text-white text-xs font-bold
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
                      className={`h-full rounded-full ${m.color}`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/admin/users")}
            className="mt-5 w-full border border-gray-200 text-[#0A1931] font-body text-xs font-semibold
              py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={13} />
            Download Full Performance Report
          </button>
        </div>
      </div>

    </div>
  )
}
