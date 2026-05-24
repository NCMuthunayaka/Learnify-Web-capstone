import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Send } from "lucide-react"
import { useState } from "react"

const statsData = [
  { label: "Subjects",    value: "05" },
  { label: "Tasks Today", value: "05" },
  { label: "Completed",   value: "15" },
]

const weeklyData = [
  { day: "Mon", value: 10 },
  { day: "Tue", value: 4  },
  { day: "Wed", value: 15 },
  { day: "Thu", value: 10 },
  { day: "Fri", value: 3  },
  { day: "Sat", value: 11 },
  { day: "Sun", value: 8  },
]

const scheduledSubjects = [
  { name: "Data Structures",  priority: "High",   dot: "bg-pink-400"  },
  { name: "Machine Learning", priority: "Medium", dot: "bg-blue-400"  },
]

const calendar = {
  month: "January",
  days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  dates: [
    [1,  2,  3,  4,  5,  6,  7 ],
    [8,  9,  10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31, null, null, null, null],
  ],
  today: 11,
  deadline: 24,
  highlight: 2,
}

function PriorityBadge({ priority }) {
  const colors = {
    High:   "bg-green-500",
    Medium: "bg-yellow-500",
    Low:    "bg-gray-400",
  }
  return (
    <span className={`text-xs font-body px-3 py-1 rounded-full
      font-medium text-white ${colors[priority]}`}>
      {priority}
    </span>
  )
}

function DashboardPage() {
  const [message, setMessage] = useState("")

  return (
    <div className="space-y-5">

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
        <div className="lg:col-span-2 bg-[#f6fafd] rounded-2xl p-6 shadow-xl
          border border-white/5">
          <h3 className="font-heading text-sm font-semibold text-[#1A3D63] mb-4">
            Weekly Progress
          </h3>
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
                domain={[0, 24]}
                ticks={[0,2,4,6,8,10,12,14,16,18,20,22,24]}
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
              <Bar dataKey="value" radius={[4,4,0,0]}>
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
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Deadlines Calendar */}
          <div className="bg-[#f6fafd] rounded-2xl p-4 shadow-lg
            border border-white/5">
            <h3 className="font-heading text-sm font-semibold text-[#1A3D63] mb-3">
              Deadlines
            </h3>
            <p className="font-body text-xs text-[#1A3D63] text-center mb-2">
              {calendar.month}
            </p>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
              {calendar.days.map((day) => (
                <div key={day}
                  className="font-body text-[10px] text-[#1A3D63]
                    text-center py-1 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Dates */}
            {calendar.dates.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((date, di) => (
                  <div
                    key={di}
                    className={`font-body text-[11px] text-center
                      w-6 h-6 mx-auto my-0.5 flex items-center
                      justify-center rounded-full
                      ${!date ? "" :
                        date === calendar.today
                          ? "bg-red-500 text-[#1A3D63] font-bold"
                          : date === calendar.deadline
                          ? "bg-yellow-400 text-[#1A3D63] font-bold"
                          : date === calendar.highlight
                          ? "bg-green-500 text-[#1A3D63] font-bold"
                          : "text-[#B3CFE5] hover:bg-[#1A3D63]"
                      }`}
                  >
                    {date || ""}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Scheduled Subjects */}
          <div className="bg-[#f6fafd] rounded-2xl p-4 shadow-lg
            border border-white/5">
            <h3 className="font-heading text-sm font-semibold text-[#1A3D63] mb-3">
              Scheduled Subjects
            </h3>
            <div className="space-y-3">
              {scheduledSubjects.map((subject) => (
                <div key={subject.name}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full
                      ${subject.dot}`} />
                    <span className="font-body text-sm text-[#1A3D63]">
                      {subject.name}
                    </span>
                  </div>
                  <PriorityBadge priority={subject.priority} />
                </div>
              ))}
            </div>
            <button className="font-body text-xs text-[#B3CFE5]
              hover:text-[#1A3D63] mt-4 w-full text-center
              transition-colors duration-200 font-medium">
              See More
            </button>
          </div>

        </div>
      </div>

      {/* ── AI Assistant ── */}
      <div className="bg-[#f6fafd] rounded-2xl p-6 shadow-lg
        border border-white/5">
        <h3 className="font-heading text-sm font-semibold text-[#1A3D63] mb-4">
          Your personal AI study assistant
        </h3>
        <div className="text-center mb-6">
          <p className="font-body text-sm text-[#1A3D63]">Hi Nirmal,</p>
          <p className="font-body text-sm text-[#1A3D63]">
            What have on your mind?
          </p>
        </div>

        {/* Chat Input */}
        <div className="flex items-center gap-3 bg-white rounded-xl
          px-4 py-3 border border-[#4A7FA7]/30">
          <input
            type="text"
            placeholder="Ask anything"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent text-white
              placeholder-[#1A3D63]/30 font-body text-sm focus:outline-none"
          />
          <button className="text-[#1A3D63] hover:text-[#4A7FA7]
            transition-colors duration-200">
            <Send size={18} />
          </button>
        </div>
      </div>

    </div>
  )
}

export default DashboardPage