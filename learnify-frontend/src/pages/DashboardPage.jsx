import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Send } from "lucide-react"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import { useAuth } from "../hooks/useAuth"
import { getDashboardStats } from "../api/dashboardApi"

// ── Helper — build calendar for current month ─────────────
function buildCalendar(deadlines) {
  const now       = new Date()
  const year      = now.getFullYear()
  const month     = now.getMonth()
  const today     = now.getDate()
  const monthName = now.toLocaleString("default", { month: "long" })

  // Get deadline dates as a Set for quick lookup
  const deadlineDates = new Set(
    deadlines.map(d => new Date(d.due_date).getDate())
  )

  // First day of month (0=Sun, 1=Mon...)
  // We want Mon-based so adjust
  const firstDay = new Date(year, month, 1).getDay()
  const adjusted = firstDay === 0 ? 6 : firstDay - 1

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build weeks array
  const dates  = []
  let   week   = Array(adjusted).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      dates.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    dates.push(week)
  }

  return { monthName, today, deadlineDates, dates }
}

export default function DashboardPage() {
  const { user }          = useAuth()
  const [message, setMessage] = useState("")

  // ── State ──────────────────────────────────────────────
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [stats, setStats]       = useState({
    subjects: 0, tasks_today: 0, completed: 0
  })
  const [weeklyData, setWeeklyData]       = useState([])
  const [deadlines, setDeadlines]         = useState([])
  const [scheduledSubjects, setScheduled] = useState([])

  // ── Fetch dashboard data ───────────────────────────────
  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const response = await getDashboardStats()
        const data     = response.data
        setStats(data.stats)
        setWeeklyData(data.weekly_chart)
        setDeadlines(data.deadlines)
        setScheduled(data.scheduled_subjects)
      } catch (err) {
        setError("Failed to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // ── Build stats cards ──────────────────────────────────
  const statsData = [
    { label: "Subjects",    value: String(stats.subjects).padStart(2, "0")    },
    { label: "Tasks Today", value: String(stats.tasks_today).padStart(2, "0") },
    { label: "Completed",   value: String(stats.completed).padStart(2, "0")   },
  ]

  // ── Build calendar ─────────────────────────────────────
  const { monthName, today, deadlineDates, dates } = buildCalendar(deadlines)
  const calendarDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // ── Get first name from user ───────────────────────────
  const firstName = user?.name?.split(" ")[0] || "there"

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError("")} />
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-[#1A3D63] to-[#4A7FA7]
              rounded-2xl px-6 py-8 text-center shadow-lg"
          >
            <p className="font-body text-xs text-[#B3CFE5] tracking-widest
              uppercase mb-3">
              {stat.label}
            </p>
            <p className="font-heading text-5xl font-bold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl
          border border-white/5">
          <h3 className="font-heading text-sm font-semibold text-[#1A3D63] mb-4">
            Weekly Progress
          </h3>

          {weeklyData.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-48">
              <p className="font-body text-sm text-gray-400">
                No study sessions recorded this week
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} barSize={35}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#1A3D63", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#1A3D63", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#4A7FA7",
                    border: "1px solid #5a93c0",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(74,127,167,0.1)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.value === Math.max(...weeklyData.map(d => d.value))
                        ? "#4A7FA7" : "#1A3D63"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Deadlines Calendar — real current month */}
          <div className="bg-white rounded-2xl p-4 shadow-lg
            border border-white/5">
            <h3 className="font-heading text-sm font-semibold
              text-[#1A3D63] mb-3">
              Deadlines
            </h3>
            <p className="font-body text-xs text-[#1A3D63]
              text-center mb-2">
              {monthName}
            </p>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
              {calendarDays.map((day) => (
                <div key={day}
                  className="font-body text-[10px] text-[#1A3D63]
                    text-center py-1 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Dates */}
            {dates.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((date, di) => (
                  <div
                    key={di}
                    className={`font-body text-[11px] text-center
                      w-6 h-6 mx-auto my-0.5 flex items-center
                      justify-center rounded-full
                      ${!date ? "" :
                        date === today
                          ? "bg-red-500 text-white font-bold"
                          : deadlineDates.has(date)
                          ? "bg-yellow-400 text-white font-bold"
                          : "text-[#4A6880] hover:bg-[#1A3D63] hover:text-white cursor-pointer"
                      }`}
                  >
                    {date || ""}
                  </div>
                ))}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-2
              border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-body text-[10px] text-gray-400">Today</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="font-body text-[10px] text-gray-400">Deadline</span>
              </div>
            </div>
          </div>

          {/* Scheduled Subjects */}
          <div className="bg-white rounded-2xl p-4 shadow-lg
            border border-white/5">
            <h3 className="font-heading text-sm font-semibold
              text-[#1A3D63] mb-3">
              Scheduled Subjects
            </h3>

            {scheduledSubjects.length === 0 ? (
              <p className="font-body text-xs text-gray-400
                text-center py-3">
                No subjects enrolled yet
              </p>
            ) : (
              <div className="space-y-3">
                {scheduledSubjects.map((subject, i) => (
                  <div key={i}
                    className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color_hex || "#4A7FA7" }}
                      />
                      <span className="font-body text-sm text-[#1A3D63]">
                        {subject.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="font-body text-xs text-[#B3CFE5]
              hover:text-[#1A3D63] mt-4 w-full text-center
              transition-colors duration-200 font-medium">
              See More
            </button>
          </div>

        </div>
      </div>

      {/* ── AI Assistant ── */}
      <div className="bg-white rounded-2xl p-6 shadow-lg
        border border-white/5">
        <h3 className="font-heading text-sm font-semibold
          text-[#1A3D63] mb-4">
          Your personal AI study assistant
        </h3>
        <div className="text-center mb-6">
          <p className="font-body text-sm text-[#1A3D63]">
            Hi {firstName},
          </p>
          <p className="font-body text-sm text-[#1A3D63]">
            What is on your mind?
          </p>
        </div>

        {/* Chat Input */}
        <div className="flex items-center gap-3 bg-white rounded-xl
          px-4 py-3 border border-[#4A7FA7]/30">
          <input
            type="text"
            placeholder="Ask anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent text-[#0A1931]
              placeholder-[#1A3D63]/30 font-body text-sm
              focus:outline-none"
          />
          <Button variant="ghost" icon={Send} size="sm" />
        </div>
      </div>

    </div>
  )
}