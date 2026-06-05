import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, Video, BookOpen, Star, Calendar, Clock,
  ArrowRight, CheckCircle, MessageSquare, Bell,
  AlertTriangle, Check, ShieldCheck, Play, BarChart4, FileText
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

export default function MentorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Dynamic user details
  const mentorName = user ? `${user.firstName} ${user.lastName}` : "Dr. James Davis"
  const mentorInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "JD"

  // Stateful Availability & Status
  const [status, setStatus] = useState("Online")
  const [availableDays, setAvailableDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [fromTime, setFromTime] = useState("10:00 AM")
  const [untilTime, setUntilTime] = useState("6:00 PM")
  const [maxRequests, setMaxRequests] = useState(8)
  const [acceptUrgent, setAcceptUrgent] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)

  // Status handler
  const statusOptions = [
    { name: "Online", color: "bg-green-500", text: "text-green-600", activeBg: "bg-green-50 border-green-200" },
    { name: "Busy", color: "bg-amber-500", text: "text-amber-600", activeBg: "bg-amber-50 border-amber-200" },
    { name: "Away", color: "bg-red-500", text: "text-red-600", activeBg: "bg-red-50 border-red-200" }
  ]

  // Day toggle handler
  function toggleDay(day) {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day))
    } else {
      setAvailableDays([...availableDays, day])
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── 1. Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3D63] to-[#0A1931] text-white p-8 shadow-md">
        {/* Abstract Light Effects */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <span className="font-heading text-xs uppercase tracking-widest text-[#B3CFE5] font-semibold">
              GOOD MORNING
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {user ? user.firstName : "Dr. Davis"} 👋
            </h2>
            <p className="font-body text-sm text-[#B3CFE5] leading-relaxed">
              You have 12 open requests · 3 urgent · 4 sessions today
            </p>
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 font-body text-xs">
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <Clock size={13} className="text-[#B3CFE5]" />
                Avg response: 18 min
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                Rating: 4.8★
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <CheckCircle size={13} className="text-[#B3CFE5]" />
                28 resolved this week
              </span>
            </div>
          </div>

          {/* SVG Illustration */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="150" height="110" viewBox="0 0 150 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-95 drop-shadow-lg">
              {/* Table */}
              <path d="M10 85 H140 V90 H10 Z" fill="#2E4F75" />
              <path d="M25 90 V105 H30 V90 Z" fill="#1E3E62" />
              <path d="M120 90 V105 H125 V90 Z" fill="#1E3E62" />
              {/* Computer Monitor */}
              <rect x="50" y="25" width="50" height="34" rx="4" fill="#E2E8F0" stroke="#4A7FA7" strokeWidth="2.5" />
              <rect x="54" y="29" width="42" height="26" rx="2" fill="#0A1931" />
              {/* Screen details / Code mock */}
              <rect x="58" y="34" width="20" height="4" rx="1" fill="#4A7FA7" />
              <rect x="58" y="41" width="34" height="2" rx="0.5" fill="#2E4F75" />
              <rect x="58" y="45" width="24" height="2" rx="0.5" fill="#2E4F75" />
              <rect x="58" y="49" width="16" height="2" rx="0.5" fill="#4A7FA7" />
              {/* Monitor stand */}
              <path d="M70 59 L67 75 H83 L80 59 Z" fill="#CBD5E1" />
              <rect x="62" y="75" width="26" height="3" rx="1" fill="#94A3B8" />
              {/* Keyboard */}
              <rect x="58" y="80" width="34" height="3" rx="1" fill="#94A3B8" />
              {/* Chair backrest */}
              <path d="M105 50 C105 45 109 42 114 42 C119 42 123 45 123 50 V75 H105 Z" fill="#1E3E62" />
              <path d="M110 75 V95 H118 V75 Z" fill="#0D2440" />
              {/* Laptop on table side */}
              <rect x="15" y="58" width="24" height="16" rx="1.5" transform="rotate(-8 15 58)" fill="#94A3B8" />
              <path d="M13 74 L37 71 V73 L13 76 Z" fill="#CBD5E1" />
              {/* Sitting Person Illustration */}
              <circle cx="114" cy="28" r="9" fill="#FEE2E2" />
              <path d="M98 68 C98 56 104 50 114 50 C124 50 130 56 130 68 V85 H98 Z" fill="#4A7FA7" />
              {/* Lamp on desk */}
              <path d="M22 85 L28 55" stroke="#E9C46A" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 57 C22 55 18 52 20 48 C22 44 28 47 30 49 L24 57 Z" fill="#E9C46A" />
              {/* Light glow */}
              <circle cx="20" cy="45" r="10" fill="#E9C46A" className="animate-pulse" opacity="0.2" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── 2. Profile and Availability Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Profile & Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#1A3D63] text-white font-bold rounded-2xl flex items-center justify-center text-xl font-heading shadow-md">
                    {mentorInitials}
                  </div>
                  {/* Verified checkmark badge */}
                  <span className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm flex items-center justify-center">
                    <ShieldCheck size={12} className="fill-white stroke-green-500" />
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0A1931]">
                    {mentorName}
                  </h3>
                  <p className="font-body text-xs text-gray-500 mt-0.5">
                    Mathematics Mentor · MIT PhD · 8 years experience
                  </p>
                  <div className="flex items-center gap-1 mt-1 font-body text-xs text-amber-500 font-semibold">
                    <Star size={13} className="fill-amber-500 stroke-amber-500" />
                    <span>4.8</span>
                    <span className="text-gray-400 font-normal ml-0.5">(142 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Biography */}
            <p className="font-body text-xs text-gray-600 leading-relaxed italic">
              "PhD in Applied Mathematics from MIT. I specialise in making complex calculus, algebra and statistics approachable and enjoyable for undergraduate students. My goal is to build lasting conceptual understanding, not just exam results."
            </p>

            {/* Skills tag pill items */}
            <div className="flex flex-wrap gap-2">
              {["Calculus", "Algebra", "Statistics", "Geometry", "Trigonometry"].map(skill => (
                <span key={skill} className="bg-gray-50 text-[#1A3D63] font-medium font-body text-xs px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bio stats card layout */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-5 mt-6">
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">142</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Students helped</p>
            </div>
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">28</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Resolved this week</p>
            </div>
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">18m</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Avg response time</p>
            </div>
          </div>

          {/* Buttons footer */}
          <div className="flex items-center gap-3 mt-6 border-t border-gray-50 pt-4">
            <button
              onClick={() => navigate("/mentor/profile")}
              className="flex-1 bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-200"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate("/mentor/profile")}
              className="flex-1 border border-[#4A7FA7] text-[#4A7FA7] hover:bg-[#F6FAFD] font-body text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200"
            >
              View Public Profile
            </button>
          </div>
        </div>

        {/* Right Card: Availability Settings */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-heading text-sm font-bold text-[#0A1931] flex items-center gap-1.5">
                Availability
              </h3>
              <Clock size={16} className="text-[#4A7FA7]" />
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map(opt => {
                const isActive = status === opt.name
                return (
                  <button
                    key={opt.name}
                    onClick={() => setStatus(opt.name)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-body font-medium transition-all duration-200 ${
                      isActive ? `${opt.activeBg} border-opacity-100 scale-[1.02] shadow-sm` : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                    <span className={isActive ? opt.text : "text-gray-500"}>{opt.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Available Days */}
            <div className="space-y-2">
              <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                Available Days
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                  const isChecked = availableDays.includes(day)
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 font-body text-xs font-bold rounded-xl border transition-all duration-200 ${
                        isChecked
                          ? "bg-[#0A1931] text-white border-[#0A1931] shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* From / Until Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                  From
                </label>
                <input
                  type="text"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-body font-medium text-gray-700 focus:outline-none focus:border-[#4A7FA7] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                  Until
                </label>
                <input
                  type="text"
                  value={untilTime}
                  onChange={(e) => setUntilTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-body font-medium text-gray-700 focus:outline-none focus:border-[#4A7FA7] transition-colors"
                />
              </div>
            </div>

            {/* Max Daily Requests Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  Max daily requests
                </label>
                <span className="font-heading text-sm font-bold text-[#1A3D63] bg-blue-50 px-2.5 py-0.5 rounded-lg">
                  {maxRequests}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={maxRequests}
                onChange={(e) => setMaxRequests(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4A7FA7]"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-5 border-t border-gray-50 mt-4">
            {/* Toggle 1: Accept urgent */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-body text-xs font-semibold text-gray-700 block">Accept urgent requests</span>
                <span className="font-body text-[10px] text-gray-400">Students with exams in &lt;48h</span>
              </div>
              <button
                onClick={() => setAcceptUrgent(!acceptUrgent)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  acceptUrgent ? "bg-[#4A7FA7]" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                  acceptUrgent ? "translate-x-4.5" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* Toggle 2: Email notifications */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-body text-xs font-semibold text-gray-700 block">Email notifications</span>
                <span className="font-body text-[10px] text-gray-400">New requests & messages</span>
              </div>
              <button
                onClick={() => setEmailNotif(!emailNotif)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  emailNotif ? "bg-[#4A7FA7]" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                  emailNotif ? "translate-x-4.5" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* Toggle 3: Auto-accept returning */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-body text-xs font-semibold text-gray-700 block">Auto-accept returning students</span>
                <span className="font-body text-[10px] text-gray-400">Students you've helped before</span>
              </div>
              <button
                onClick={() => setAutoAccept(!autoAccept)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  autoAccept ? "bg-[#4A7FA7]" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                  autoAccept ? "translate-x-4.5" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. This Week At a Glance ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h3 className="font-heading text-base font-bold text-[#0A1931]">
            This week at a glance
          </h3>
          <span className="font-body text-xs font-bold text-[#4A7FA7] bg-[#EBF3F9] px-3 py-1 rounded-full border border-[#D5E6F2]">
            Week 17, 2026
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Open Requests */}
          <div className="bg-[#F6FAFD]/60 border border-blue-100 hover:border-blue-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Open Requests
            </span>
            <span className="font-heading text-3xl font-extrabold text-blue-900 block mt-2">12</span>
            <span className="font-body text-[10px] text-blue-600 font-semibold block mt-1.5">
              3 urgent need attention
            </span>
          </div>

          {/* Card 2: Resolved */}
          <div className="bg-[#F6FAFD]/60 border border-green-100 hover:border-green-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Resolved
            </span>
            <span className="font-heading text-3xl font-extrabold text-green-900 block mt-2">28</span>
            <span className="font-body text-[10px] text-green-600 font-semibold block mt-1.5">
              +4 vs last week
            </span>
          </div>

          {/* Card 3: Avg Response */}
          <div className="bg-[#F6FAFD]/60 border border-teal-100 hover:border-teal-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Avg Response
            </span>
            <span className="font-heading text-3xl font-extrabold text-teal-900 block mt-2">18m</span>
            <span className="font-body text-[10px] text-teal-600 font-semibold block mt-1.5">
              Better than 30m target
            </span>
          </div>

          {/* Card 4: Student Rating */}
          <div className="bg-[#F6FAFD]/60 border border-amber-100 hover:border-amber-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Student Rating
            </span>
            <span className="font-heading text-3xl font-extrabold text-amber-900 block mt-2">4.8★</span>
            <span className="font-body text-[10px] text-amber-600 font-semibold block mt-1.5">
              Top 5% of mentors
            </span>
          </div>

          {/* Card 5: Total Students */}
          <div className="bg-[#F6FAFD]/60 border border-purple-100 hover:border-purple-300 rounded-2xl p-5 col-span-2 md:col-span-1 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Total Students
            </span>
            <span className="font-heading text-3xl font-extrabold text-purple-900 block mt-2">142</span>
            <span className="font-body text-[10px] text-purple-600 font-semibold block mt-1.5">
              All-time helped
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Today's Sessions & Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sessions list */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-[#0A1931]">
                  Today's Sessions
                </h3>
                <span className="font-body text-xs font-semibold bg-[#EBF3F9] text-[#1A3D63] px-2.5 py-0.5 rounded-lg border border-[#D5E6F2]">
                  4 scheduled
                </span>
              </div>
              <button
                onClick={() => navigate("/scheduler")}
                className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] hover:underline flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { time: "9:00 - 9:45 AM", initials: "AS", name: "Ashani We.", subject: "Calculus", desc: "Integration by parts", status: "In Progress", statusColor: "bg-green-500 text-green-600 border-green-100 bg-green-50/30", btnText: "Join", btnPrimary: true },
                { time: "11:00 - 11:30", initials: "RL", name: "M. Nayana", subject: "Geometry", desc: "Proof by contradiction", status: "Upcoming", statusColor: "bg-blue-500 text-blue-600 border-blue-100 bg-blue-50/30", btnText: "Prepare", btnPrimary: false },
                { time: "2:00 - 2:45 PM", initials: "LM", name: "Mugith", subject: "Algebra", desc: "Matrix operations - Exam tomorrow!", status: "Urgent", statusColor: "bg-orange-500 text-orange-600 border-orange-100 bg-orange-50/30", btnText: "Prepare", btnPrimary: false },
                { time: "4:00 - 4:30 PM", initials: "DN", name: "Kavindu Chamith", subject: "Statistics", desc: "Regression analysis & R-squared", status: "Upcoming", statusColor: "bg-blue-500 text-blue-600 border-blue-100 bg-blue-50/30", btnText: "Prepare", btnPrimary: false }
              ].map((sess, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-50 rounded-xl hover:bg-gray-50/50 transition-all duration-200 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-24 font-body text-xs font-semibold text-gray-500">
                      {sess.time}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-[#1A3D63] font-bold flex items-center justify-center text-xs font-heading">
                      {sess.initials}
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-[#0A1931]">
                        {sess.name}
                      </h4>
                      <p className="font-body text-xs text-gray-400 mt-0.5">
                        <span className="font-semibold text-gray-500">{sess.subject}</span> — {sess.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end sm:justify-start">
                    <span className={`px-2.5 py-1 rounded-lg border font-body text-[10px] font-bold flex items-center gap-1.5 ${sess.statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sess.status === "In Progress" ? "bg-green-500 animate-pulse" : sess.status === "Urgent" ? "bg-orange-500" : "bg-blue-500"
                      }`} />
                      {sess.status}
                    </span>

                    {sess.btnPrimary ? (
                      <button
                        onClick={() => navigate("/scheduler")}
                        className="bg-[#0A1931] hover:bg-[#1A3D63] text-white px-4 py-1.5 rounded-xl font-body text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Play size={12} className="fill-white" />
                        {sess.btnText}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/scheduler")}
                        className="border border-[#4A7FA7] text-[#4A7FA7] hover:bg-[#F6FAFD] px-4 py-1.5 rounded-xl font-body text-xs font-semibold transition-colors"
                      >
                        {sess.btnText}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
              <h3 className="font-heading text-base font-bold text-[#0A1931]">
                Performance by Subject
              </h3>
              <BarChart4 size={18} className="text-[#4A7FA7]" />
            </div>

            <div className="space-y-4">
              {[
                { name: "Calculus", value: 92, bg: "bg-blue-500" },
                { name: "Algebra", value: 67, bg: "bg-orange-500" },
                { name: "Statistics", value: 78, bg: "bg-amber-600" },
                { name: "Geometry", value: 85, bg: "bg-green-500" },
                { name: "Trig", value: 83, bg: "bg-purple-500" }
              ].map((subject, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-body font-bold text-gray-700">
                    <span>{subject.name}</span>
                    <span>{subject.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${subject.bg}`}
                      style={{ width: `${subject.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-gray-50 pt-5 mt-6 font-body">
            <div className="text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Overall Satisfaction</span>
              <span className="font-heading text-lg font-bold text-[#0A1931] mt-0.5 block">
                4.8 <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Completion Rate</span>
              <span className="font-heading text-lg font-bold text-green-600 mt-0.5 block">
                94%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. Recent Notifications ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-[#0A1931]">
              Recent Notifications
            </h3>
            <span className="font-body text-xs font-semibold bg-red-50 text-red-500 px-2.5 py-0.5 rounded-lg border border-red-100">
              3 new
            </span>
          </div>
          <button className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] hover:underline flex items-center gap-1 transition-colors">
            Mark all read <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {[
            { icon: AlertTriangle, bg: "bg-red-50 text-red-500 border-red-100", title: "Nayana", msg: "urgent! Exam tomorrow and needs help with matrix operations ASAP.", time: "10 minutes ago", unread: true },
            { icon: MessageSquare, bg: "bg-amber-50 text-amber-500 border-amber-100", title: "New request from Jayamai", msg: "Statistics, confidence intervals. Awaiting your review.", time: "1 hour ago", unread: true },
            { icon: Star, bg: "bg-orange-50 text-orange-500 border-orange-100", title: "Rashmika", msg: "left you a 5★ review: \"Dr. Davis explained integration by parts perfectly!\"", time: "3 hours ago", unread: true },
            { icon: CheckCircle, bg: "bg-green-50 text-green-500 border-green-100", title: "Deshan's", msg: "session — Limits & Continuity — marked as resolved successfully.", time: "Yesterday, 4:30 PM", unread: false },
            { icon: Calendar, bg: "bg-blue-50 text-blue-500 border-blue-100", title: "Your schedule for next week", msg: "has been published. 5 students have already booked sessions.", time: "Yesterday, 8:00 AM", unread: false }
          ].map((notif, idx) => {
            const IconComponent = notif.icon
            return (
              <div key={idx} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 transition-colors">
                <div className={`w-9 h-9 rounded-full ${notif.bg} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-[#0A1931]">{notif.title}</span> {notif.msg}
                  </p>
                  <span className="font-body text-[10px] text-gray-400 block mt-1">{notif.time}</span>
                </div>
                {notif.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2.5 animate-pulse" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 6. Quick Actions ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-50 pb-4">
          <h3 className="font-heading text-base font-bold text-[#0A1931]">
            Quick Actions
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: MessageSquare, bg: "bg-blue-50/55 text-blue-500 border-blue-100 hover:border-blue-300 hover:bg-blue-100/20", title: "View Pending Requests", path: "/mentor/requests" },
            { icon: Calendar, bg: "bg-green-50/55 text-green-500 border-green-100 hover:border-green-300 hover:bg-green-100/20", title: "Set Next Week Schedule", path: "/scheduler" },
            { icon: BarChart4, bg: "bg-purple-50/55 text-purple-500 border-purple-100 hover:border-purple-300 hover:bg-purple-100/20", title: "Monthly Performance Report", path: "/mentor/dashboard" },
            { icon: FileText, bg: "bg-amber-50/55 text-amber-500 border-amber-100 hover:border-amber-300 hover:bg-amber-100/20", title: "Create Response Template", path: "/mentor/dashboard" },
            { icon: BookOpen, bg: "bg-teal-50/55 text-teal-500 border-teal-100 hover:border-teal-300 hover:bg-teal-100/20", title: "Upload Study Resources", path: "/mentor/resources" }
          ].map((act, idx) => {
            const Icon = act.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(act.path)}
                className={`flex flex-col items-center justify-center text-center p-5 rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer ${act.bg}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm mb-3 border border-gray-100/50">
                  <Icon size={18} />
                </div>
                <span className="font-body text-xs font-bold text-gray-700 leading-tight">
                  {act.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
