import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { FaBookOpen, FaCheckCircle, FaClock, FaBullseye } from "react-icons/fa"
import ProgressBar from "../components/common/ProgressBar"
import Button from "../components/common/Button"
import Badge from "../components/common/Badge"

// ── Data ──────────────────────────────────────────────────
const statsData = [
  {
    icon: FaBookOpen,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    label: "Study Hours This Week",
    value: "24.5h",
    sub: "↑ 3.2h vs last week",
    subColor: "text-green-500",
  },
  {
    icon: FaCheckCircle,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    label: "Sessions Completed",
    value: "18",
    sub: "86% completion rate",
    subColor: "text-gray-400",
  },
  {
    icon: FaClock,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    label: "Upcoming Deadlines",
    value: "4",
    sub: "2 due this week",
    subColor: "text-gray-400",
  },
  {
    icon: FaBullseye,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    label: "Focus Score",
    value: "91%",
    sub: "Excellent consistency",
    subColor: "text-green-500",
  },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = ["8:00 AM", "10:00 AM", "12:00 PM", "1:00 PM", "3:00 PM", "5:00 PM"]

const subjectColors = {
  Mathematics: "bg-[#0D2440]",
  Physics: "bg-[#2E5B82]",
  Chemistry: "bg-[#EAF0F6]",
  Biology: "bg-[#7BA7D7]",
  "English Lit": "bg-[#C6D8EB]",
  English: "bg-[#C6D8EB]",
}

const subjectTextColors = {
  Mathematics: "text-white",
  Physics: "text-white",
  Chemistry: "text-[#0D2440]",
  Biology: "text-[#0D2440]",
  "English Lit": "text-[#0D2440]",
  English: "text-[#0D2440]",
}

const timetable = {
  "8:00 AM": {
    Monday: { subject: "Mathematics", detail: "Calculus - Ch.4" },
    Tuesday: null,
    Wednesday: { subject: "Mathematics", detail: "Algebra" },
    Thursday: null,
    Friday: { subject: "Physics", detail: "Mechanics" },
    Saturday: null,
  },
  "10:00 AM": {
    Monday: { subject: "Chemistry", detail: "Organic - Lab" },
    Tuesday: { subject: "Physics", detail: "Waves & Optics" },
    Wednesday: { subject: "English", detail: "Essay Writing" },
    Thursday: { subject: "Chemistry", detail: "Periodic Table" },
    Friday: { subject: "Mathematics", detail: "Statistics" },
    Saturday: { subject: "Biology", detail: "Cell Biology" },
  },
  "12:00 PM": {
    Monday: null, Tuesday: null, Wednesday: null,
    Thursday: null, Friday: null, Saturday: null,
  },
  "1:00 PM": {
    Monday: { subject: "Biology", detail: "Genetics" },
    Tuesday: { subject: "English Lit", detail: "Shakespeare" },
    Wednesday: { subject: "Physics", detail: "Thermodynamics" },
    Thursday: { subject: "Biology", detail: "Ecosystems" },
    Friday: null,
    Saturday: { subject: "Chemistry", detail: "Revision" },
  },
  "3:00 PM": {
    Monday: { subject: "English", detail: "Reading" },
    Tuesday: { subject: "Mathematics", detail: "Problem Set" },
    Wednesday: null,
    Thursday: { subject: "Mathematics", detail: "Practice" },
    Friday: { subject: "Biology", detail: "Diagrams" },
    Saturday: null,
  },
  "5:00 PM": {
    Monday: null,
    Tuesday: { subject: "Chemistry", detail: "Past Papers" },
    Wednesday: { subject: "Biology", detail: "Flash Cards" },
    Thursday: { subject: "English", detail: "Poetry" },
    Friday: null,
    Saturday: { subject: "Mathematics", detail: "Mock Test" },
  },
}

const todaysSessions = [
  {
    subject: "Mathematics — Statistics",
    detail: "Chapter 7: Probability",
    time: "8:00 – 9:30 AM",
    status: "Done",
    statusColor: "text-green-500",
    dot: "bg-blue-500",
  },
  {
    subject: "Physics — Thermodynamics",
    detail: "Heat Transfer & Entropy",
    time: "10:00 – 11:30 AM",
    status: "Active",
    statusColor: "text-yellow-500",
    dot: "bg-sky-500",
  },
  {
    subject: "Chemistry — Organic Lab",
    detail: "Organic reactions write-up",
    time: "1:00 – 2:30 PM",
    status: "Soon",
    statusColor: "text-gray-400",
    dot: "bg-cyan-500",
  },
  {
    subject: "English — Essay Writing",
    detail: "Argumentative structure",
    time: "3:00 – 4:00 PM",
    status: "Soon",
    statusColor: "text-gray-400",
    dot: "bg-indigo-500",
  },
]

const subjectPerformance = [
  { name: "Mathematics", percent: 82, color: "bg-blue-500" },
  { name: "Physics", percent: 74, color: "bg-sky-500" },
  { name: "Chemistry", percent: 91, color: "bg-cyan-500" },
  { name: "Biology", percent: 67, color: "bg-teal-500" },
  { name: "English", percent: 78, color: "bg-indigo-500" },
]

const aiTips = [
  {
    icon: "🤖",
    tip: "Schedule Biology earlier in the day",
    detail: "Your retention is 23% higher in morning sessions",
  },
  {
    icon: "⚙️",
    tip: "Add a 10-min break after Physics",
    detail: "Pomodoro pattern improves focus by 18%",
  },
  {
    icon: "🚀",
    tip: "Chemistry exam in 12 days",
    detail: "Increase revision sessions by 1 per day",
  },
]

const upcomingDeadlines = [
  { title: "Mathematics Mock Exam", detail: "Chapter 7 — Statistics", days: 3 },
  { title: "Physics Assignment", detail: "Thermodynamics report", days: 5 },
  { title: "Chemistry Lab Report", detail: "Organic reactions write-up", days: 8 },
  { title: "English Essay Draft", detail: "Argumentative essay - 1200w", days: 12 },
]

const legendItems = [
  { label: "Mathematics", color: "bg-[#0D2440]" },
  { label: "Physics",     color: "bg-[#2E5B82]" },
  { label: "Chemistry",   color: "bg-[#EAF0F6] border border-gray-200" },
  { label: "Biology",     color: "bg-[#7BA7D7]" },
  { label: "English",     color: "bg-[#C6D8EB]" },
  { label: "Free Slot",   color: "border border-dashed border-[#B3CFE5]" },
]

// ── Component ─────────────────────────────────────────────
function SchedulerPage() {
  const [intensity, setIntensity] = useState("Balanced (4–5 hrs/day)")
  const [subject, setSubject] = useState("Mathematics")
  const [examDate, setExamDate] = useState("2026-05-20")

  // Timetable study status logs state (initialised with logs to sum to exactly 24.5h and 18 completed sessions)
  const [timetableLogs, setTimetableLogs] = useState({
    "8:00 AM-Monday": { status: "Completed", hours: 2.0 },
    "10:00 AM-Monday": { status: "Partially Completed", hours: 1.5 },
    "1:00 PM-Monday": { status: "Completed", hours: 2.0 },
    "3:00 PM-Monday": { status: "Partially Completed", hours: 0.5 },
    "10:00 AM-Tuesday": { status: "Completed", hours: 2.0 },
    "1:00 PM-Tuesday": { status: "Partially Completed", hours: 1.0 },
    "3:00 PM-Tuesday": { status: "Partially Completed", hours: 1.5 },
    "5:00 PM-Tuesday": { status: "Partially Completed", hours: 1.0 },
    "8:00 AM-Wednesday": { status: "Completed", hours: 2.0 },
    "10:00 AM-Wednesday": { status: "Partially Completed", hours: 1.0 },
    "1:00 PM-Wednesday": { status: "Partially Completed", hours: 1.5 },
    "5:00 PM-Wednesday": { status: "Partially Completed", hours: 1.0 },
    "10:00 AM-Thursday": { status: "Partially Completed", hours: 1.5 },
    "1:00 PM-Thursday": { status: "Completed", hours: 2.0 },
    "3:00 PM-Thursday": { status: "Partially Completed", hours: 1.0 },
    "5:00 PM-Thursday": { status: "Partially Completed", hours: 1.0 },
    "8:00 AM-Friday": { status: "Partially Completed", hours: 1.5 },
    "3:00 PM-Friday": { status: "Partially Completed", hours: 0.5 },
  })

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [tempStatus, setTempStatus] = useState("Completed") // "Completed", "Partially Completed", "Skipped"
  const [tempHours, setTempHours] = useState(2.0)

  // Open modal handler
  function handleOpenModal(time, day, subject, detail) {
    const slotKey = `${time}-${day}`
    const existingLog = timetableLogs[slotKey] || { status: "Untracked", hours: 0 }
    
    setSelectedSlot({ time, day, subject, detail, key: slotKey })
    setTempStatus(existingLog.status === "Untracked" ? "Completed" : existingLog.status)
    setTempHours(existingLog.status === "Untracked" ? 2.0 : existingLog.hours)
    setIsModalOpen(true)
  }

  // Save progress handler
  function handleSaveProgress() {
    if (!selectedSlot) return
    
    const finalHours = tempStatus === "Completed" ? 2.0 : tempStatus === "Skipped" ? 0 : tempHours
    
    setTimetableLogs({
      ...timetableLogs,
      [selectedSlot.key]: {
        status: tempStatus,
        hours: finalHours
      }
    })
    setIsModalOpen(false)
  }

  // Dynamic header stats calculations
  const totalHours = Object.values(timetableLogs).reduce((sum, log) => sum + log.hours, 0)
  const completedSessionsCount = Object.values(timetableLogs).filter(log => log.hours > 0).length

  const dynamicStats = [
    {
      icon: FaBookOpen,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      label: "Study Hours This Week",
      value: `${totalHours.toFixed(1)}h`,
      sub: "↑ 3.2h vs last week",
      subColor: "text-green-500",
    },
    {
      icon: FaCheckCircle,
      iconColor: "text-green-500",
      iconBg: "bg-green-50",
      label: "Sessions Completed",
      value: `${completedSessionsCount}`,
      sub: `${Math.round((completedSessionsCount / 22) * 100)}% completion rate`,
      subColor: "text-gray-400",
    },
    {
      icon: FaClock,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
      label: "Upcoming Deadlines",
      value: "4",
      sub: "2 due this week",
      subColor: "text-gray-400",
    },
    {
      icon: FaBullseye,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-50",
      label: "Focus Score",
      value: `${completedSessionsCount > 0 ? Math.min(100, Math.round(91 * (completedSessionsCount / 18))) : 0}%`,
      sub: "Excellent consistency",
      subColor: "text-green-500",
    },
  ]

  return (
    <div className="space-y-5 relative">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label}
              className="bg-white rounded-2xl px-5 py-4 shadow-lg
                border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg}
                flex items-center justify-center mb-3`}>
                <Icon size={20} className={stat.iconColor} />
              </div>
              <p className="font-body text-xs text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="font-heading text-2xl font-bold text-[#0A1931]">
                {stat.value}
              </p>
              <p className={`font-body text-xs mt-1 ${stat.subColor}`}>
                {stat.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly Timetable */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-lg
          border border-gray-100">

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">
              Weekly Timetable
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded hover:bg-gray-100
                text-gray-400 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="font-body text-xs text-gray-500">
                Apr 14 – Apr 20, 2026
              </span>
              <button className="p-1 rounded hover:bg-gray-100
                text-gray-400 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="font-body text-gray-400 font-medium
                    text-left py-2 pr-3 w-20">Time</th>
                  {days.map((day) => (
                    <th key={day}
                      className="font-body text-gray-500 font-semibold
                        text-center py-2 px-1">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="font-body text-gray-400 text-xs
                      py-1.5 pr-3 whitespace-nowrap align-top pt-2">
                      {time}
                    </td>

                    {time === "12:00 PM" ? (
                      <td colSpan={6}
                        className="text-center font-body text-xs
                          text-gray-300 py-2 italic">
                        — Lunch Break —
                      </td>
                    ) : (
                      days.map((day) => {
                        const cell = timetable[time]?.[day]
                        if (!cell) {
                          return (
                            <td key={day} className="py-1 px-1">
                              <div className="border border-dashed border-[#B3CFE5] rounded-lg py-4 text-center text-[#B3CFE5] font-body text-[10px] font-bold min-h-[58px] flex items-center justify-center bg-transparent">
                                Free
                              </div>
                            </td>
                          )
                        }

                        const logKey = `${time}-${day}`
                        const log = timetableLogs[logKey]
                        const hasLogged = !!log
                        const isCompleted = log?.status === "Completed"
                        const isPartial = log?.status === "Partially Completed"
                        const isSkipped = log?.status === "Skipped"

                        return (
                          <td key={day} className="py-1 px-1">
                            <button
                              onClick={() => handleOpenModal(time, day, cell.subject, cell.detail)}
                              className={`w-full text-left rounded-lg py-2 px-2 min-h-[58px] transition-all duration-200 hover:scale-[1.02] hover:shadow-md border border-transparent ${subjectColors[cell.subject] || "bg-gray-100"}`}
                            >
                              <p className={`font-body font-semibold text-[11px] leading-tight ${
                                isSkipped ? "line-through text-gray-400" : subjectTextColors[cell.subject] || "text-gray-700"
                              }`}>
                                {cell.subject}
                              </p>
                              {cell.detail && (
                                <p className={`font-body text-[10px] leading-tight mt-0.5 ${
                                  isSkipped ? "line-through text-gray-400" : "text-gray-500"
                                }`}>
                                  {cell.detail}
                                </p>
                              )}

                              {/* Progress Status Indicator */}
                              <div className="mt-2 flex items-center gap-1">
                                {isCompleted && (
                                  <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                                    ✓ 2.0h
                                  </span>
                                )}
                                {isPartial && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                                    ◷ {log.hours}h
                                  </span>
                                )}
                                {isSkipped && (
                                  <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                                    ✗ Skipped
                                  </span>
                                )}
                                {!hasLogged && (
                                  <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">
                                    Track
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>
                        )
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3
            border-t border-gray-100">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                <span className="font-body text-[11px] text-gray-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Auto Generate */}
          <div className="bg-white rounded-2xl p-5 shadow-lg
            border border-gray-100">
            <h3 className="font-heading text-sm font-semibold
              text-[#0A1931] mb-1">
              Auto-Generate Timetable
            </h3>
            <p className="font-body text-xs text-gray-400 mb-4
              leading-relaxed">
              Let AI build the perfect study schedule based on
              your subjects, difficulty & deadlines.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-body text-xs text-gray-500
                  mb-1 block">
                  Study Intensity
                </label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  className="w-full bg-white text-gray-700 font-body
                    text-xs px-3 py-2.5 rounded-lg border border-gray-200
                    focus:outline-none focus:border-[#4A7FA7]"
                >
                  <option>Light (2–3 hrs/day)</option>
                  <option>Balanced (4–5 hrs/day)</option>
                  <option>Intensive (6+ hrs/day)</option>
                </select>
              </div>

              <div>
                <label className="font-body text-xs text-gray-500
                  mb-1 block">
                  Focus subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white text-gray-700 font-body
                    text-xs px-3 py-2.5 rounded-lg border border-gray-200
                    focus:outline-none focus:border-[#4A7FA7]"
                >
                  {["Mathematics", "Physics", "Chemistry", "Biology", "English"].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-xs text-gray-500
                  mb-1 block">
                  Exam date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-white text-gray-700 font-body
                    text-xs px-3 py-2.5 rounded-lg border border-gray-200
                    focus:outline-none focus:border-[#4A7FA7]"
                />
              </div>
              <Button
                variant="primary"
                fullWidth
                icon={Plus}
              >
                Generate My Schedule
              </Button>
            </div>
          </div>

          {/* Today's Sessions */}
          <div className="bg-white rounded-2xl p-5 shadow-lg
            border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-semibold
                text-[#0A1931]">
                Today's Sessions
              </h3>
              <span className="font-body text-xs text-gray-400">
                Sunday, Apr 19
              </span>
            </div>
            <div className="space-y-3">
              {todaysSessions.map((session, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5
                    flex-shrink-0 ${session.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs text-[#0A1931]
                      font-semibold leading-tight">
                      {session.subject}
                    </p>
                    <p className="font-body text-[10px] text-gray-400">
                      {session.detail}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-body text-[10px] text-gray-400">
                      {session.time}
                    </p>
                    <p className={`font-body text-[10px] font-semibold
                      ${session.statusColor}`}>
                      {session.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-heading text-sm font-semibold text-[#0A1931] mb-4">
            Subject Performance
          </h3>
          <div className="space-y-3">
            {subjectPerformance.map((item) => (
              <ProgressBar
                key={item.name}
                value={item.percent}
                label={item.name}
                showPercent
                color={
                  item.name === "Mathematics" ? "primary" :
                    item.name === "Physics" ? "accent" :
                      item.name === "Chemistry" ? "success" :
                        item.name === "Biology" ? "warning" : "purple"
                }
              />
            ))}
          </div>
        </div>

        {/* AI Study Tips */}
        <div className="bg-white rounded-2xl p-5 shadow-lg
          border border-gray-100">
          <h3 className="font-heading text-sm font-semibold
            text-[#0A1931] mb-4">
            AI Study Tips
          </h3>
          <div className="space-y-4">
            {aiTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="font-body text-xs font-semibold
                    text-[#0A1931] leading-tight">
                    {tip.tip}
                  </p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">
                    {tip.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl p-5 shadow-lg
          border border-gray-100">
          <h3 className="font-heading text-sm font-semibold
            text-[#0A1931] mb-4">
            Upcoming Deadlines
          </h3>
          <div className="space-y-3">
            {upcomingDeadlines.map((item, i) => (
              <div key={i} className="flex items-start justify-between
                border-l-4 border-[#1A3D63] pl-3 py-1">
                <div>
                  <p className="font-body text-xs font-semibold
                    text-[#0A1931]">
                    {item.title}
                  </p>
                  <p className="font-body text-[10px] text-gray-400">
                    {item.detail}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-heading text-lg font-bold
                    text-[#1A3D63]">
                    {item.days}
                  </p>
                  <p className="font-body text-[10px] text-gray-400">
                    days left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 4. Track Slot Progress Modal ── */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-[#0A1931]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="font-heading text-sm font-bold text-[#0A1931] border-b border-gray-50 pb-3">
              Track Study Progress
            </h3>
            
            <div className="space-y-4 pt-4 font-body text-xs text-gray-600">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#4A7FA7] tracking-wider block">Subject</span>
                <p className="font-heading text-sm font-bold text-[#1A3D63] mt-0.5">
                  {selectedSlot.subject}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">{selectedSlot.detail}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F6FAFD] p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Day</span>
                  <p className="font-bold text-gray-700 mt-0.5">{selectedSlot.day}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Time Slot</span>
                  <p className="font-bold text-gray-700 mt-0.5">{selectedSlot.time}</p>
                </div>
              </div>

              {/* Status Choices Card list */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">How did you do?</span>
                <div className="flex flex-col gap-2">
                  
                  {/* Option 1: Completed */}
                  <button
                    onClick={() => {
                      setTempStatus("Completed")
                      setTempHours(2.0)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      tempStatus === "Completed"
                        ? "bg-green-50/50 border-green-300 text-green-800 shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                      tempStatus === "Completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-200"
                    }`}>
                      {tempStatus === "Completed" && "✓"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs">Completed Completely</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Studied the entire session (2.0 hrs)</p>
                    </div>
                  </button>

                  {/* Option 2: Partially Completed */}
                  <button
                    onClick={() => {
                      setTempStatus("Partially Completed")
                      if (tempHours === 2.0 || tempHours === 0) setTempHours(1.0)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      tempStatus === "Partially Completed"
                        ? "bg-amber-50/50 border-amber-300 text-amber-800 shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                      tempStatus === "Partially Completed" ? "bg-amber-500 border-amber-500 text-white" : "border-gray-200"
                    }`}>
                      {tempStatus === "Partially Completed" && "◷"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs">Partially Completed</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Studied for a portion of the session</p>
                    </div>
                  </button>

                  {/* Option 3: Skipped */}
                  <button
                    onClick={() => {
                      setTempStatus("Skipped")
                      setTempHours(0)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      tempStatus === "Skipped"
                        ? "bg-red-50/50 border-red-300 text-red-800 shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                      tempStatus === "Skipped" ? "bg-red-500 border-red-500 text-white" : "border-gray-200"
                    }`}>
                      {tempStatus === "Skipped" && "✗"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs">Skipped / Did not study</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Was not able to study this session (0 hrs)</p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Slider (shown only if status is Partial) */}
              {tempStatus === "Partially Completed" && (
                <div className="space-y-2 bg-amber-50/30 p-3 rounded-xl border border-amber-100/40 animate-in slide-in-from-top-2 duration-200 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Specify study time</span>
                    <span className="font-heading text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      {tempHours} hrs / 2.0 hrs max
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.25"
                    value={tempHours}
                    onChange={(e) => setTempHours(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-0.5 mt-1">
                    <span>15 mins</span>
                    <span>1 hour</span>
                    <span>2 hours</span>
                  </div>
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-50 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-body text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgress}
                className="flex-1 bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-200"
              >
                Save Progress
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default SchedulerPage