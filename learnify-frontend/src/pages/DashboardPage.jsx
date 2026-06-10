import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Send } from "lucide-react"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import { getDashboardStats } from "../api/dashboardApi"

function DashboardPage() {
  const [message, setMessage]   = useState("")
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")

  // ── Real data from backend ────────────────────────────
  const [stats, setStats]                   = useState({
    subjects: 0, tasks_today: 0, completed: 0
  })
  const [weeklyData, setWeeklyData]         = useState([])
  const [deadlines, setDeadlines]           = useState([])
  const [scheduledSubjects, setScheduled]   = useState([])

  // ── Fetch dashboard data on load ──────────────────────
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

  // ── Stats cards data ───────────────────────────────────
  const statsData = [
    { label: "Subjects",    value: String(stats.subjects).padStart(2, "0")    },
    { label: "Tasks Today", value: String(stats.tasks_today).padStart(2, "0") },
    { label: "Completed",   value: String(stats.completed).padStart(2, "0")   },
  ]

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label}
            className="bg-gradient-to-br from-[#1A3D63] to-[#4A7FA7]
              rounded-2xl px-6 py-8 text-center shadow-lg">
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

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-[#1A3D63] rounded-2xl p-6 shadow-lg">
          <h3 className="font-heading text-sm font-semibold text-white mb-4">
            Weekly Progress
          </h3>
          {weeklyData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="font-body text-sm text-[#B3CFE5]">
                No study sessions recorded this week
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} barSize={35}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="day"
                  tick={{ fill: "#B3CFE5", fontSize: 12 }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#B3CFE5", fontSize: 12 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1931",
                    border: "1px solid #4A7FA7",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(74,127,167,0.1)" }}
                />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={index}
                      fill={entry.value === Math.max(...weeklyData.map(d => d.value))
                        ? "#4A7FA7" : "#1A3D63"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Deadlines */}
          <div className="bg-[#1A3D63] rounded-2xl p-4 shadow-lg">
            <h3 className="font-heading text-sm font-semibold
              text-white mb-3">
              Upcoming Deadlines
            </h3>
            {deadlines.length === 0 ? (
              <p className="font-body text-xs text-[#B3CFE5] text-center py-4">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-2">
                {deadlines.slice(0, 5).map((deadline, i) => (
                  <div key={i}
                    className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: deadline.color_hex || "#4A7FA7" }}
                      />
                      <span className="font-body text-xs text-white
                        truncate max-w-[120px]">
                        {deadline.title}
                      </span>
                    </div>
                    <span className="font-body text-[10px] text-[#B3CFE5]
                      flex-shrink-0">
                      {new Date(deadline.due_date).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short"
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Subjects */}
          <div className="bg-[#1A3D63] rounded-2xl p-4 shadow-lg">
            <h3 className="font-heading text-sm font-semibold
              text-white mb-3">
              Scheduled Subjects
            </h3>
            {scheduledSubjects.length === 0 ? (
              <p className="font-body text-xs text-[#B3CFE5] text-center py-4">
                No subjects enrolled yet
              </p>
            ) : (
              <div className="space-y-3">
                {scheduledSubjects.map((subject, i) => (
                  <div key={i}
                    className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subject.color_hex || "#4A7FA7" }}
                      />
                      <span className="font-body text-sm text-white">
                        {subject.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="font-body text-xs text-[#B3CFE5]
              hover:text-white mt-4 w-full text-center
              transition-colors duration-200 font-medium">
              See More
            </button>
          </div>

        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-[#1A3D63] rounded-2xl p-6 shadow-lg">
        <h3 className="font-heading text-sm font-semibold text-white mb-4">
          Your personal AI study assistant
        </h3>
        <div className="text-center mb-6">
          <p className="font-body text-sm text-[#B3CFE5]">
            Hi there,
          </p>
          <p className="font-body text-sm text-[#B3CFE5]">
            What have on your mind?
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0A1931] rounded-xl
          px-4 py-3 border border-white/10">
          <input
            type="text"
            placeholder="Ask anything"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent text-white
              placeholder-white/30 font-body text-sm focus:outline-none"
          />
          <Button variant="ghost" icon={Send} size="sm" />
        </div>
      </div>

    </div>
  )
}

export default DashboardPage