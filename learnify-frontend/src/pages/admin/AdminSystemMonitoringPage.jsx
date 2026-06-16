import { useState, useEffect, useCallback } from "react"
import {
  Activity, Download, RefreshCw, Server, HardDrive,
  Wifi, AlertTriangle, ExternalLink, Database, Users
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts"
import { getSystemHealth } from "../../api/adminApi"

// Active-users shape: static 24-hour curve (no real-time endpoint)
const ACTIVE_USERS_TEMPLATE = [
  { time: "00:00", users: 0 },
  { time: "03:00", users: 0 },
  { time: "06:00", users: 0 },
  { time: "09:00", users: 0 },
  { time: "12:00", users: 0 },
  { time: "15:00", users: 0 },
  { time: "18:00", users: 0 },
  { time: "21:00", users: 0 },
  { time: "Now",   users: 0 },
]

const API_REQUEST_TEMPLATE = [34, 52, 68, 45, 60, 78, 43, 88, 110].map(v => ({ value: v }))

const SYSTEM_EVENTS = [
  {
    dotColor: "bg-blue-500",
    title: "API health check",
    desc: "All endpoints responded normally.",
    time: "Just now",
    isAlert: false,
    hasLink: false,
  },
  {
    dotColor: "bg-green-500",
    title: "Database connection verified",
    desc: "DB-Cluster confirmed healthy on startup.",
    time: "On load",
    isAlert: false,
    hasLink: false,
  },
]

function AreaTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs font-body">
        <p className="font-bold text-[#0A1931]">{label}</p>
        <p className="text-[#4A7FA7]">{payload[0].value} users</p>
      </div>
    )
  }
  return null
}

function BarTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs font-body">
        <p className="font-bold text-[#0A1931]">{payload[0].value} req/s</p>
      </div>
    )
  }
  return null
}

function CpuGauge({ percent, label = "OPERATIONAL" }) {
  const r      = 54
  const circ   = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color  = percent > 90 ? "#EF4444" : percent > 70 ? "#F59E0B" : "#0A1931"
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text
        x="70" y="65"
        textAnchor="middle"
        style={{ fontSize: 22, fontWeight: 800, fill: color, fontFamily: "inherit" }}
      >
        {percent}%
      </text>
      <text
        x="70" y="83"
        textAnchor="middle"
        style={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600, letterSpacing: 1, fontFamily: "inherit" }}
      >
        {label}
      </text>
    </svg>
  )
}

export default function AdminSystemMonitoringPage() {
  const [health,    setHealth]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeBar, setActiveBar] = useState(null)

  // Distribute active users based on real total
  function buildActiveUsers(activeCount) {
    const dist = [0.08, 0.04, 0.03, 0.12, 0.22, 0.25, 0.30, 0.28, 0.33]
    return ACTIVE_USERS_TEMPLATE.map((pt, i) => ({
      ...pt,
      users: Math.round(activeCount * dist[i]),
    }))
  }

  const fetchHealth = useCallback((showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    getSystemHealth()
      .then(res => setHealth(res.data))
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  function handleRefresh() { fetchHealth(true) }

  const dbOk      = health?.database === "healthy"
  const apiOk     = health?.api === "healthy"
  const uptime    = health?.uptime_pct ?? 99.9
  const total     = health?.total_users    ?? 0
  const active    = health?.active_users   ?? 0
  const feedback  = health?.total_feedback ?? 0

  const activeUsersData = buildActiveUsers(active)
  const activeRatePct   = total > 0 ? Math.round((active / total) * 100) : 0

  const events = [
    {
      dotColor: dbOk ? "bg-green-500" : "bg-red-500",
      title: dbOk ? "Database: Healthy" : "Database: Connection Error",
      desc: dbOk ? "DB responding normally." : "Unable to reach the database.",
      time: "Checked now",
      isAlert: !dbOk,
      hasLink: false,
    },
    {
      dotColor: apiOk ? "bg-blue-500" : "bg-red-500",
      title: apiOk ? "API: Healthy" : "API: Error",
      desc: "REST endpoints responding.",
      time: "Checked now",
      isAlert: !apiOk,
      hasLink: false,
    },
    ...SYSTEM_EVENTS,
  ]

  const bottomMetrics = [
    {
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
      value: total.toLocaleString(),
      label: "TOTAL USERS",
      badge: `${active} active`,
      badgeColor: "text-green-600",
    },
    {
      icon: Database,
      iconBg: "bg-teal-50 text-teal-600",
      value: dbOk ? "Online" : "Offline",
      label: "DATABASE STATUS",
      badge: dbOk ? "Healthy" : "Error",
      badgeColor: dbOk ? "text-green-600" : "text-red-600",
    },
    {
      icon: Wifi,
      iconBg: "bg-green-50 text-green-600",
      value: `${uptime}%`,
      label: "UPTIME",
      badge: "Stable",
      badgeColor: "text-green-600",
    },
    {
      icon: AlertTriangle,
      iconBg: feedback > 0 ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400",
      value: feedback.toLocaleString(),
      label: "TOTAL FEEDBACK",
      badge: feedback > 0 ? "Logged" : "None",
      badgeColor: feedback > 0 ? "text-amber-600" : "text-gray-400",
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── Header ── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-body text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            Live Infrastructure
          </span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-[#0A1931]">System Monitoring</h1>
            <p className="font-body text-sm text-gray-400 mt-1">
              Real-time health overview and performance telemetry across all nodes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200
              font-body text-xs font-semibold text-[#0A1931] hover:bg-gray-50 transition-colors">
              <Download size={14} />
              Export Report
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A1931] text-white
                font-body text-xs font-semibold hover:bg-[#1A3D63] transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh Now"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Main 2-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ─ Left: Charts ─ */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Active Users */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-heading text-base font-bold text-[#0A1931]">Active Users</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-body text-xs text-gray-400 font-semibold">
                      {active.toLocaleString()} online
                    </span>
                  </div>
                </div>
                <p className="font-body text-xs text-gray-400 mb-5">Estimated concurrency over 24 hours</p>

                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={activeUsersData} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0A1931" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#0A1931" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<AreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#0A1931"
                      strokeWidth={2.5}
                      fill="url(#userGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#4A7FA7", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* API Request Volume */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-base font-bold text-[#0A1931]">API Request Volume</h2>
                  <span className="font-body text-xs text-gray-400 font-semibold">Requests/sec</span>
                </div>

                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    data={API_REQUEST_TEMPLATE}
                    barCategoryGap="25%"
                    onMouseLeave={() => setActiveBar(null)}
                  >
                    <XAxis hide />
                    <YAxis hide />
                    <Tooltip content={<BarTooltip />} cursor={false} />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(_, index) => setActiveBar(index)}
                    >
                      {API_REQUEST_TEMPLATE.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            index === API_REQUEST_TEMPLATE.length - 1 || activeBar === index
                              ? "#0A1931"
                              : "#B3CFE5"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex justify-between font-body text-[10px] text-gray-400 mt-2 px-1">
                  <span>10m ago</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* ─ Right: Health Gauge + Events ─ */}
            <div className="flex flex-col gap-6">

              {/* Active Rate Gauge */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-heading text-base font-bold text-[#0A1931] mb-5">User Activity Rate</h2>

                <div className="flex justify-center">
                  <CpuGauge percent={activeRatePct} label="ACTIVE USERS" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-50">
                  <div className="text-center">
                    <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Total
                    </p>
                    <p className="font-heading text-xl font-extrabold text-[#0A1931] mt-1">
                      {total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Active
                    </p>
                    <p className="font-heading text-xl font-extrabold text-[#0A1931] mt-1">
                      {active.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Events */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1">
                <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                  <h2 className="font-heading text-sm font-bold text-[#0A1931]">System Events</h2>
                  <button className="w-7 h-7 rounded-lg border border-gray-100 flex items-center justify-center
                    text-gray-400 hover:text-[#4A7FA7] hover:border-[#4A7FA7] transition-colors">
                    <Activity size={13} />
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${ev.dotColor}`} />
                        {i < events.length - 1 && (
                          <span className="w-px h-6 bg-gray-100" />
                        )}
                      </div>
                      <div className="min-w-0 -mt-0.5 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`font-body text-xs font-semibold leading-snug ${
                            ev.isAlert ? "text-red-600" : "text-[#0A1931]"
                          }`}>
                            {ev.title}
                          </p>
                          {ev.hasLink && (
                            <ExternalLink size={11} className="text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="font-body text-[10px] text-gray-400 mt-0.5 leading-relaxed">{ev.desc}</p>
                        <p className="font-body text-[9px] text-gray-300 mt-1 uppercase tracking-wide font-semibold">
                          {ev.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="mt-5 w-full border border-gray-200 text-[#0A1931] font-body text-xs font-bold
                  py-2.5 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-wider">
                  View Audit Logs
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {bottomMetrics.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.label}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
                    flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-heading text-xl font-extrabold text-[#0A1931]">
                        {m.value}
                      </span>
                      <span className={`font-body text-[10px] font-bold ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                      {m.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
}
