import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, Video, BookOpen, Star, Calendar, Clock,
  ArrowRight, CheckCircle, MessageSquare, Bell,
  AlertTriangle, Check, ShieldCheck, Play, BarChart4, FileText,
  X, Copy, Plus, ChevronLeft, ChevronRight
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { getMentorStats, updateMentorSettings } from "../../api/mentorApi"
import LoadingSpinner from "../../components/common/LoadingSpinner"

export default function MentorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Dynamic user details
  const nameParts = (user?.name || "").split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const mentorName = user ? user.name : "Academic Mentor"
  const mentorInitials = user
    ? `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase()
    : "AM"

  // Stateful Availability & Preferences
  const [status, setStatus] = useState("Online")
  const [availableDays, setAvailableDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [fromTime, setFromTime] = useState("10:00 AM")
  const [untilTime, setUntilTime] = useState("06:00 PM")
  const [maxRequests, setMaxRequests] = useState(8)
  const [acceptUrgent, setAcceptUrgent] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)

  // API Stats Data States
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    title: "Academic Mentor",
    institution: "Learnify",
    years_experience: 5,
    rating: 4.8,
    total_students_helped: 142,
    avg_response_time_min: 18,
    bio: "PhD in Applied Mathematics. Specializing in making complex topics digestible.",
    subject: "Mathematics"
  })
  const [stats, setStats] = useState({
    open_requests: 0,
    resolved: 0,
    avg_response: 18,
    rating: 4.8,
    total_students: 142
  })
  const [sessions, setSessions] = useState([])
  const [performance, setPerformance] = useState([])
  const [notifications, setNotifications] = useState([])

  // Availability section reference for scrolling
  const availabilityRef = useRef(null)
  const [highlightAvailability, setHighlightAvailability] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Modals state
  const [activeSession, setActiveSession] = useState(null)
  const [prepSession, setPrepSession] = useState(null)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [showPerfReport, setShowPerfReport] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState([
    { id: 1, title: "Standard Welcome", content: "Hi [Student], thank you for reaching out! I've reviewed your request and would be happy to help. Let's schedule a brief session to discuss." },
    { id: 2, title: "Follow-up Question", content: "Hi [Student], I am looking over your work. Could you please send over the specific question details or past paper year you are working on?" }
  ])
  const [newTemplateTitle, setNewTemplateTitle] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")

  // Fetch mentor details and dashboard statistics on mount
  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        const response = await getMentorStats()
        const data = response.data
        
        setProfile(data.profile)
        setStats(data.stats)
        
        // Settings states
        if (data.status) setStatus(data.status)
        if (data.settings) {
          setAvailableDays(data.settings.availableDays)
          setFromTime(data.settings.fromTime)
          setUntilTime(data.settings.untilTime)
          setMaxRequests(data.settings.maxRequests)
          setAcceptUrgent(data.settings.acceptUrgent)
          setEmailNotif(data.settings.emailNotif)
          setAutoAccept(data.settings.autoAccept)
        }

        setSessions(data.sessions)
        setPerformance(data.performance)
        setNotifications(data.notifications)
      } catch (err) {
        console.error("Failed to load mentor dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  // Auto-save settings toast trigger on input shifts
  const isMounted = useRef(false)
  useEffect(() => {
    if (isMounted.current) {
      const saveSettings = async () => {
        try {
          await updateMentorSettings({
            status,
            acceptUrgent,
            emailNotif,
            autoAccept,
            availableDays,
            fromTime,
            untilTime,
            maxRequests
          })
          setToastMessage("Settings auto-saved successfully!")
          const timer = setTimeout(() => setToastMessage(""), 2000)
          return () => clearTimeout(timer)
        } catch (err) {
          console.error("Failed to auto-save settings:", err)
        }
      }
      saveSettings()
    } else {
      isMounted.current = true
    }
  }, [status, availableDays, fromTime, untilTime, maxRequests, acceptUrgent, emailNotif, autoAccept])

  // Helper for notification icons
  const getNotificationIcon = (title) => {
    const t = title.toLowerCase()
    if (t.includes("urgent") || t.includes("request")) return AlertTriangle
    if (t.includes("reply") || t.includes("message") || t.includes("new request")) return MessageSquare
    if (t.includes("review") || t.includes("rating") || t.includes("feedback")) return Star
    if (t.includes("resolve") || t.includes("completed")) return CheckCircle
    return Calendar
  }

  // Day toggle handler
  function toggleDay(day) {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day))
    } else {
      setAvailableDays([...availableDays, day])
    }
  }

  const statusOptions = [
    { name: "Online", color: "bg-green-500", text: "text-green-600", activeBg: "bg-green-50 border-green-200" },
    { name: "Busy", color: "bg-amber-500", text: "text-amber-600", activeBg: "bg-amber-50 border-amber-200" },
    { name: "Away", color: "bg-red-500", text: "text-red-600", activeBg: "bg-red-50 border-red-200" }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Loading mentor dashboard..." />
      </div>
    )
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
              Welcome back, {user ? firstName : "Mentor"} 👋
            </h2>
            <p className="font-body text-sm text-[#B3CFE5] leading-relaxed">
              You have {stats.open_requests} open requests · {sessions.length} sessions today
            </p>
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 font-body text-xs">
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <Clock size={13} className="text-[#B3CFE5]" />
                Avg response: {stats.avg_response} min
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                Rating: {stats.rating}★
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <CheckCircle size={13} className="text-[#B3CFE5]" />
                {stats.resolved} resolved this week
              </span>
            </div>
          </div>

          {/* Illustration Graphic */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="150" height="110" viewBox="0 0 150 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-95 drop-shadow-lg">
              <path d="M10 85 H140 V90 H10 Z" fill="#2E4F75" />
              <path d="M25 90 V105 H30 V90 Z" fill="#1E3E62" />
              <path d="M120 90 V105 H125 V90 Z" fill="#1E3E62" />
              <rect x="50" y="25" width="50" height="34" rx="4" fill="#E2E8F0" stroke="#4A7FA7" strokeWidth="2.5" />
              <rect x="54" y="29" width="42" height="26" rx="2" fill="#0A1931" />
              <rect x="58" y="34" width="20" height="4" rx="1" fill="#4A7FA7" />
              <rect x="58" y="41" width="34" height="2" rx="0.5" fill="#2E4F75" />
              <rect x="58" y="45" width="24" height="2" rx="0.5" fill="#2E4F75" />
              <rect x="58" y="49" width="16" height="2" rx="0.5" fill="#4A7FA7" />
              <path d="M70 59 L67 75 H83 L80 59 Z" fill="#CBD5E1" />
              <rect x="62" y="75" width="26" height="3" rx="1" fill="#94A3B8" />
              <rect x="58" y="80" width="34" height="3" rx="1" fill="#94A3B8" />
              <path d="M105 50 C105 45 109 42 114 42 C119 42 123 45 123 50 V75 H105 Z" fill="#1E3E62" />
              <path d="M110 75 V95 H118 V75 Z" fill="#0D2440" />
              <rect x="15" y="58" width="24" height="16" rx="1.5" transform="rotate(-8 15 58)" fill="#94A3B8" />
              <path d="M13 74 L37 71 V73 L13 76 Z" fill="#CBD5E1" />
              <circle cx="114" cy="28" r="9" fill="#FEE2E2" />
              <path d="M98 68 C98 56 104 50 114 50 C124 50 130 56 130 68 V85 H98 Z" fill="#4A7FA7" />
              <path d="M22 85 L28 55" stroke="#E9C46A" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 57 C22 55 18 52 20 48 C22 44 28 47 30 49 L24 57 Z" fill="#E9C46A" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#1A3D63] text-white font-bold rounded-2xl flex items-center justify-center text-xl font-heading shadow-md">
                    {mentorInitials}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm flex items-center justify-center">
                    <ShieldCheck size={12} className="fill-white stroke-green-500" />
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0A1931]">
                    {mentorName}
                  </h3>
                  <p className="font-body text-xs text-gray-500 mt-0.5">
                    {profile.title} · {profile.institution} · {profile.years_experience} years experience
                  </p>
                  <div className="flex items-center gap-1 mt-1 font-body text-xs text-amber-500 font-semibold">
                    <Star size={13} className="fill-amber-500 stroke-amber-500" />
                    <span>{profile.rating}</span>
                    <span className="text-gray-400 font-normal ml-0.5">({stats.total_students} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-gray-600 leading-relaxed italic">
              "{profile.bio || 'PhD in Applied Mathematics from MIT. Specialty in Calculus and Algebra. Dedicated to building concepts.'}"
            </p>

            <div className="flex flex-wrap gap-2">
              {(profile.subject || "Mathematics").split(",").map(skill => (
                <span key={skill.trim()} className="bg-gray-50 text-[#1A3D63] font-medium font-body text-xs px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-5 mt-6">
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">{stats.total_students}</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Students helped</p>
            </div>
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">{stats.resolved}</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Resolved this week</p>
            </div>
            <div className="text-center bg-[#F6FAFD]/60 rounded-xl p-3 border border-gray-50/50">
              <span className="font-heading text-xl font-extrabold text-[#1A3D63]">{stats.avg_response}m</span>
              <p className="font-body text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Avg response time</p>
            </div>
          </div>

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
        <div
          ref={availabilityRef}
          className={`bg-white rounded-2xl p-6 border transition-all duration-500 shadow-sm flex flex-col justify-between ${
            highlightAvailability ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md scale-[1.01]" : "border-gray-100"
          }`}
        >
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

          {/* Toggle Preferences Switches */}
          <div className="space-y-3 pt-5 border-t border-gray-50 mt-4">
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
          <div className="bg-[#F6FAFD]/60 border border-blue-100 hover:border-blue-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Open Requests
            </span>
            <span className="font-heading text-3xl font-extrabold text-blue-900 block mt-2">{stats.open_requests}</span>
            <span className="font-body text-[10px] text-blue-600 font-semibold block mt-1.5">
              Requires attention
            </span>
          </div>

          <div className="bg-[#F6FAFD]/60 border border-green-100 hover:border-green-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Resolved
            </span>
            <span className="font-heading text-3xl font-extrabold text-green-900 block mt-2">{stats.resolved}</span>
            <span className="font-body text-[10px] text-green-600 font-semibold block mt-1.5">
              Completed discussions
            </span>
          </div>

          <div className="bg-[#F6FAFD]/60 border border-teal-100 hover:border-teal-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Avg Response
            </span>
            <span className="font-heading text-3xl font-extrabold text-teal-900 block mt-2">{stats.avg_response}m</span>
            <span className="font-body text-[10px] text-teal-600 font-semibold block mt-1.5">
              Response time target
            </span>
          </div>

          <div className="bg-[#F6FAFD]/60 border border-amber-100 hover:border-amber-300 rounded-2xl p-5 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Student Rating
            </span>
            <span className="font-heading text-3xl font-extrabold text-amber-900 block mt-2">{stats.rating}★</span>
            <span className="font-body text-[10px] text-amber-600 font-semibold block mt-1.5">
              Cumulative reviews
            </span>
          </div>

          <div className="bg-[#F6FAFD]/60 border border-purple-100 hover:border-purple-300 rounded-2xl p-5 col-span-2 md:col-span-1 transition-all duration-200 shadow-sm">
            <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
              Total Students
            </span>
            <span className="font-heading text-3xl font-extrabold text-purple-900 block mt-2">{stats.total_students}</span>
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
                  Active Sessions
                </h3>
                <span className="font-body text-xs font-semibold bg-[#EBF3F9] text-[#1A3D63] px-2.5 py-0.5 rounded-lg border border-[#D5E6F2]">
                  {sessions.length} today
                </span>
              </div>
              <button
                onClick={() => setShowAllSessions(true)}
                className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] hover:underline flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="font-body text-xs text-gray-400 italic py-4">No active mentoring sessions today</p>
              ) : (
                sessions.map((sess, idx) => (
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
                          sess.status === "In Progress" ? "bg-green-500 animate-pulse" : "bg-blue-500"
                        }`} />
                        {sess.status}
                      </span>

                      {sess.btnPrimary ? (
                        <button
                          onClick={() => setActiveSession(sess)}
                          className="bg-[#0A1931] hover:bg-[#1A3D63] text-white px-4 py-1.5 rounded-xl font-body text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Play size={12} className="fill-white" />
                          {sess.btnText}
                        </button>
                      ) : (
                        <button
                          onClick={() => setPrepSession(sess)}
                          className="border border-[#4A7FA7] text-[#4A7FA7] hover:bg-[#F6FAFD] px-4 py-1.5 rounded-xl font-body text-xs font-semibold transition-colors"
                        >
                          {sess.btnText}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
              <h3 className="font-heading text-base font-bold text-[#0A1931]">
                Subject Breakdown
              </h3>
              <BarChart4 size={18} className="text-[#4A7FA7]" />
            </div>

            <div className="space-y-4">
              {performance.map((subject, idx) => (
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
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Satisfaction</span>
              <span className="font-heading text-lg font-bold text-[#0A1931] mt-0.5 block">
                {stats.rating} <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
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
              {notifications.filter(n => n.unread).length} unread
            </span>
          </div>
          <button className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] hover:underline flex items-center gap-1 transition-colors border-none bg-transparent">
            Mark all read <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <p className="font-body text-xs text-gray-400 italic py-4 text-center">No recent notifications</p>
          ) : (
            notifications.map((notif, idx) => {
              const IconComponent = getNotificationIcon(notif.title)
              return (
                <div key={idx} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-50 border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IconComponent size={16} className="text-[#4A7FA7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs text-gray-700 leading-relaxed">
                      <span className="font-bold text-[#0A1931]">{notif.title}</span>: {notif.msg}
                    </p>
                    <span className="font-body text-[10px] text-gray-400 block mt-1">{notif.time}</span>
                  </div>
                  {notif.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2.5 animate-pulse" />
                  )}
                </div>
              )
            })
          )}
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
            { icon: MessageSquare, bg: "bg-blue-50/55 text-blue-500 border-blue-100 hover:border-blue-300 hover:bg-blue-100/20", title: "View Pending Requests", path: "/mentor/requests", actionType: "navigate" },
            { icon: Calendar, bg: "bg-green-50/55 text-green-500 border-green-100 hover:border-green-300 hover:bg-green-100/20", title: "Set Next Week Schedule", path: "", actionType: "schedule" },
            { icon: BarChart4, bg: "bg-purple-50/55 text-purple-500 border-purple-100 hover:border-purple-300 hover:bg-purple-100/20", title: "Monthly Performance Report", path: "", actionType: "performance" },
            { icon: FileText, bg: "bg-amber-50/55 text-amber-500 border-amber-100 hover:border-amber-300 hover:bg-amber-100/20", title: "Create Response Template", path: "", actionType: "template" },
            { icon: BookOpen, bg: "bg-teal-50/55 text-teal-500 border-teal-100 hover:border-teal-300 hover:bg-teal-100/20", title: "Upload Study Resources", path: "/mentor/resources", actionType: "navigate" }
          ].map((act, idx) => {
            const Icon = act.icon
            const handleClick = () => {
              if (act.actionType === "navigate") {
                navigate(act.path)
              } else if (act.actionType === "schedule") {
                availabilityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                setHighlightAvailability(true)
                setTimeout(() => setHighlightAvailability(false), 2500)
              } else if (act.actionType === "performance") {
                setShowPerfReport(true)
              } else if (act.actionType === "template") {
                setShowTemplateModal(true)
              }
            }
            return (
              <button
                key={idx}
                onClick={handleClick}
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

      {/* ── Auto-save Notification Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-green-600 text-white font-body text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-green-500/20 flex items-center gap-2">
          <CheckCircle size={15} />
          {toastMessage}
        </div>
      )}

      {/* ── Active Session Modal (Join) ── */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-[#0A1931]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Left side: Simulated Video Call */}
            <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-between text-white relative min-h-[300px] md:min-h-0">
              <div className="flex items-center justify-between z-10">
                <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Class
                </span>
                <span className="font-mono text-xs bg-black/40 px-3 py-1 rounded-full text-slate-300">
                  Time remaining: 24:15
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1A3D63]/30 to-[#0A1931]/80">
                <div className="w-24 h-24 rounded-full bg-[#1A3D63] border-4 border-white/20 flex items-center justify-center shadow-lg mb-3">
                  <span className="font-heading text-3xl font-bold text-white">{activeSession.initials}</span>
                </div>
                <h4 className="font-heading text-sm font-bold">{activeSession.name}</h4>
                <p className="font-body text-xs text-slate-400 mt-1">{activeSession.subject} — {activeSession.desc}</p>
              </div>

              <div className="flex items-center justify-center gap-4 z-10">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border-none">
                  <Clock size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-[#4A7FA7] hover:bg-[#4A7FA7]/80 flex items-center justify-center transition-colors border-none">
                  <Video size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border-none">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>

            {/* Right side: Session details */}
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 flex flex-col justify-between p-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-[#0A1931]">Virtual Classroom</h3>
                  <button 
                    onClick={() => setActiveSession(null)} 
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Student Name</label>
                    <span className="text-xs text-slate-700 font-semibold">{activeSession.name}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Session Topic</label>
                    <span className="text-xs text-slate-700 font-semibold">{activeSession.desc}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meeting Type</label>
                    <span className="text-xs text-slate-700 font-semibold">One-on-One Mentoring</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quick Share Material</label>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("https://learnify.edu/shared/notes-calculus");
                      setToastMessage("Resource link copied!");
                      setTimeout(() => setToastMessage(""), 2000);
                    }}
                    className="w-full bg-white hover:bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-left text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="truncate">Calculus cheat sheet.pdf</span>
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <a 
                  href="https://meet.google.com/mock-session" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-body text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
                >
                  <Video size={14} />
                  Launch Google Meet
                </a>
                <button 
                  onClick={() => setActiveSession(null)}
                  className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-body text-xs font-bold py-2.5 rounded-xl transition-colors bg-white cursor-pointer"
                >
                  End Classroom Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Prepare Session Modal (Prepare) ── */}
      {prepSession && (
        <div className="fixed inset-0 z-50 bg-[#0A1931]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-heading text-sm font-bold text-[#0A1931]">Prepare Session</h3>
              </div>
              <button 
                onClick={() => setPrepSession(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                <h4 className="font-heading text-xs font-bold text-[#0A1931]">{prepSession.name}</h4>
                <p className="font-body text-xs text-slate-500 mt-1">{prepSession.subject} · {prepSession.desc}</p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#4A7FA7] font-semibold bg-[#EBF3F9] px-2.5 py-1 rounded-lg w-max">
                  <Clock size={12} />
                  <span>Scheduled today: {prepSession.time}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teaching Checklist</h5>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 accent-[#4A7FA7]" defaultChecked />
                    <span>Review student's recent test performance</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 accent-[#4A7FA7]" />
                    <span>Prepare Calculus practice exercises</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 accent-[#4A7FA7]" />
                    <span>Open screen-share whiteboard app</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suggested Material</h5>
                <button 
                  onClick={() => {
                    setToastMessage("Material link copied!");
                    setTimeout(() => setToastMessage(""), 2000);
                  }}
                  className="w-full bg-[#EBF3F9]/60 hover:bg-[#EBF3F9]/90 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-left text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="truncate">Reference Worksheet #3 — Limits.pdf</span>
                  <Copy size={13} className="text-[#4A7FA7]" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setPrepSession(null)}
                className="flex-1 border border-slate-200 text-slate-500 hover:bg-slate-50 font-body text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors bg-white cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setPrepSession(null);
                  setActiveSession(prepSession);
                }}
                className="flex-1 bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-center cursor-pointer border-none"
              >
                Launch Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Weekly Schedule Modal (View all sessions) ── */}
      {showAllSessions && (
        <div className="fixed inset-0 z-50 bg-[#0A1931]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#4A7FA7]" />
                <h3 className="font-heading text-sm font-bold text-[#0A1931]">Weekly Schedule</h3>
              </div>
              <button 
                onClick={() => setShowAllSessions(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {[
                { day: "Monday", list: sessions.filter((_, i) => i % 5 === 0) },
                { day: "Tuesday", list: sessions.filter((_, i) => i % 5 === 1) },
                { day: "Wednesday", list: sessions.filter((_, i) => i % 5 === 2) },
                { day: "Thursday", list: sessions.filter((_, i) => i % 5 === 3) },
                { day: "Friday", list: sessions.filter((_, i) => i % 5 === 4) }
              ].map((group, index) => (
                <div key={index} className="pt-3 first:pt-0">
                  <h4 className="font-heading text-xs font-bold text-slate-400 mb-2">{group.day}</h4>
                  {group.list.length === 0 ? (
                    <p className="font-body text-xs text-slate-300 italic">No classes scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {group.list.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="font-body text-xs text-slate-500 font-semibold w-16">{c.time}</span>
                            <div>
                              <p className="font-heading text-xs font-bold text-[#0A1931]">{c.name}</p>
                              <p className="font-body text-[10px] text-slate-400">{c.subject} · {c.desc}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            c.status === "Completed" ? "bg-green-50 text-green-600 border border-green-100" :
                            c.status === "Urgent" ? "bg-orange-50 text-orange-600 border border-orange-100 animate-pulse" :
                            "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Performance Report Modal ── */}
      {showPerfReport && (
        <div className="fixed inset-0 z-50 bg-[#0A1931]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart4 size={18} className="text-[#4A7FA7]" />
                <h3 className="font-heading text-sm font-bold text-[#0A1931]">Performance Report</h3>
              </div>
              <button 
                onClick={() => setShowPerfReport(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Rating</span>
                <span className="font-heading text-2xl font-extrabold text-[#0A1931] mt-1 block">{stats.rating}★</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Response Time</span>
                <span className="font-heading text-2xl font-extrabold text-[#0A1931] mt-1 block">{stats.avg_response}m</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completion Rate</span>
                <span className="font-heading text-2xl font-extrabold text-[#0A1931] mt-1 block">94%</span>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">Teaching Metrics Breakdown</h4>
              <div className="space-y-3.5">
                {[
                  { name: "Clear explanations", value: 96 },
                  { name: "Patience & encouragement", value: 92 },
                  { name: "Lesson materials quality", value: 88 }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.value}% positive</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Reviews</h4>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Rashmika</span>
                    <span className="text-amber-500 font-bold">5.0★</span>
                  </div>
                  <p className="font-body text-xs text-slate-500 mt-1 italic">"Davis explained integration by parts perfectly! I could understand the formula easily."</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Ashani We.</span>
                    <span className="text-amber-500 font-bold">5.0★</span>
                  </div>
                  <p className="font-body text-xs text-slate-500 mt-1 italic">"Highly patient. Walked me through step-by-step calculus calculations."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Response Template Modal ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-[#0A1931]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#4A7FA7]" />
                <h3 className="font-heading text-sm font-bold text-[#0A1931]">Response Templates</h3>
              </div>
              <button 
                onClick={() => setShowTemplateModal(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold text-[#0A1931]">{tpl.title}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(tpl.content);
                        setToastMessage("Template copied!");
                        setTimeout(() => setToastMessage(""), 2000);
                      }}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#4A7FA7] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      <Copy size={11} />
                      Copy text
                    </button>
                  </div>
                  <p className="font-body text-xs text-slate-500 leading-relaxed">{tpl.content}</p>
                </div>
              ))}
            </div>

            {/* Form to create new template */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider">Create New Template</h4>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Template Title" 
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-body focus:outline-none focus:border-[#4A7FA7]"
                />
                <textarea 
                  placeholder="Write template response body..." 
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-body focus:outline-none focus:border-[#4A7FA7] resize-none"
                />
              </div>
              <button 
                onClick={() => {
                  if (newTemplateTitle.trim() && newTemplateContent.trim()) {
                    setTemplates([...templates, { id: Date.now(), title: newTemplateTitle, content: newTemplateContent }]);
                    setNewTemplateTitle("");
                    setNewTemplateContent("");
                    setToastMessage("Template created!");
                    setTimeout(() => setToastMessage(""), 2000);
                  }
                }}
                className="w-full bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer border-none"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
