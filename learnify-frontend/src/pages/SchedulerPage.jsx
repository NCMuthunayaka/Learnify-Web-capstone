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
  Mathematics: "bg-blue-100 border-l-4 border-blue-500",
  Physics: "bg-sky-100 border-l-4 border-sky-500",
  Chemistry: "bg-cyan-100 border-l-4 border-cyan-500",
  Biology: "bg-teal-100 border-l-4 border-teal-500",
  "English Lit": "bg-indigo-100 border-l-4 border-indigo-500",
  English: "bg-indigo-100 border-l-4 border-indigo-500",
}

const subjectTextColors = {
  Mathematics: "text-blue-800",
  Physics: "text-sky-800",
  Chemistry: "text-cyan-800",
  Biology: "text-teal-800",
  "English Lit": "text-indigo-800",
  English: "text-indigo-800",
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
  { label: "Mathematics", color: "bg-blue-500" },
  { label: "Physics", color: "bg-sky-500" },
  { label: "Chemistry", color: "bg-cyan-500" },
  { label: "Biology", color: "bg-teal-500" },
  { label: "English", color: "bg-indigo-500" },
  { label: "Free Slot", color: "bg-gray-200" },
]

// ── Component ─────────────────────────────────────────────
function SchedulerPage() {
  const [intensity, setIntensity] = useState("Balanced (4–5 hrs/day)")
  const [subject, setSubject] = useState("Mathematics")
  const [examDate, setExamDate] = useState("2026-05-20")

  return (
    <div className="space-y-5">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
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
                              <div className="min-h-[48px]" />
                            </td>
                          )
                        }
                        return (
                          <td key={day} className="py-1 px-1">
                            <div className={`rounded-lg py-2 px-2
                              min-h-[48px] ${subjectColors[cell.subject]
                              || "bg-gray-100 border-l-4 border-gray-300"}`}>
                              <p className={`font-body font-semibold
                                text-[11px] leading-tight
                                ${subjectTextColors[cell.subject]
                                || "text-gray-700"}`}>
                                {cell.subject}
                              </p>
                              {cell.detail && (
                                <p className="font-body text-[10px]
                                  text-gray-500 leading-tight mt-0.5">
                                  {cell.detail}
                                </p>
                              )}
                            </div>
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
    </div>
  )
}

export default SchedulerPage