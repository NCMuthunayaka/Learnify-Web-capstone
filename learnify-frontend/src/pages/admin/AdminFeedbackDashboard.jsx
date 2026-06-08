import { useState } from "react"
import {
  MessageSquare, Star, ThumbsUp, ThumbsDown, Minus,
  Filter, Search, TrendingUp, BarChart2, ChevronDown
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts"

// ── Static data ──

const feedbackStats = [
  {
    label: "Total Feedback",
    value: "1,847",
    change: "+23 this week",
    icon: MessageSquare,
    iconBg: "bg-blue-50 text-blue-600",
    changeBg: "text-blue-600",
  },
  {
    label: "Avg Rating",
    value: "4.6★",
    change: "+0.2 vs last month",
    icon: Star,
    iconBg: "bg-amber-50 text-amber-500",
    changeBg: "text-green-600",
  },
  {
    label: "Positive",
    value: "1,324",
    change: "71.7%",
    icon: ThumbsUp,
    iconBg: "bg-green-50 text-green-600",
    changeBg: "text-green-600",
  },
  {
    label: "Needs Attention",
    value: "187",
    change: "10.1%",
    icon: ThumbsDown,
    iconBg: "bg-red-50 text-red-500",
    changeBg: "text-red-500",
  },
]

const trendData = [
  { week: "W1", positive: 82, negative: 12, neutral: 18 },
  { week: "W2", positive: 95, negative: 8,  neutral: 22 },
  { week: "W3", positive: 78, negative: 15, neutral: 20 },
  { week: "W4", positive: 110, negative: 10, neutral: 25 },
  { week: "W5", positive: 98,  negative: 14, neutral: 21 },
  { week: "W6", positive: 125, negative: 9,  neutral: 28 },
]

const feedbackItems = [
  {
    id: 1,
    user: "Ashani Weerasinghe",
    initials: "AW",
    avatarBg: "bg-blue-500",
    role: "Student",
    subject: "Calculus",
    mentor: "Prof. David Chen",
    rating: 5,
    sentiment: "positive",
    category: "Mentor Quality",
    comment: "Prof. Chen explained integration by parts so clearly. I finally understand the concept after struggling for weeks. His patience and approach are outstanding.",
    date: "2 hours ago",
  },
  {
    id: 2,
    user: "Marcus Thorne",
    initials: "MT",
    avatarBg: "bg-purple-500",
    role: "Student",
    subject: "Statistics",
    mentor: "Dr. Aisha Khan",
    rating: 4,
    sentiment: "positive",
    category: "Session Quality",
    comment: "Great session on regression analysis. Could have gone a bit deeper into the assumptions but overall very helpful.",
    date: "5 hours ago",
  },
  {
    id: 3,
    user: "Kavindu Chamith",
    initials: "KC",
    avatarBg: "bg-teal-500",
    role: "Student",
    subject: "Platform",
    mentor: null,
    rating: 2,
    sentiment: "negative",
    category: "Platform Issue",
    comment: "The video call kept dropping during my session. Very frustrating when trying to go through problems. Needs fixing urgently.",
    date: "1 day ago",
  },
  {
    id: 4,
    user: "Ruba Shalini",
    initials: "RS",
    avatarBg: "bg-amber-500",
    role: "Student",
    subject: "Algebra",
    mentor: "Michael Scott",
    rating: 5,
    sentiment: "positive",
    category: "Mentor Quality",
    comment: "Michael is phenomenal at breaking down matrix operations. My exam is tomorrow and I feel completely prepared now.",
    date: "1 day ago",
  },
  {
    id: 5,
    user: "Priya Nair",
    initials: "PN",
    avatarBg: "bg-rose-500",
    role: "Student",
    subject: "AI Chat",
    mentor: null,
    rating: 3,
    sentiment: "neutral",
    category: "AI Assistant",
    comment: "The AI assistant is helpful for basic questions but sometimes gives generic answers that aren't specific enough to my problem.",
    date: "2 days ago",
  },
  {
    id: 6,
    user: "Daniel Fernandez",
    initials: "DF",
    avatarBg: "bg-cyan-500",
    role: "Student",
    subject: "Geometry",
    mentor: "Sarah Palmer",
    rating: 4,
    sentiment: "positive",
    category: "Session Quality",
    comment: "Sarah made the proof by contradiction concept click for me. The visual approach she uses is really effective.",
    date: "3 days ago",
  },
]

const SENTIMENT_COLORS = {
  positive: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500",  label: "Positive" },
  negative: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500",    label: "Negative" },
  neutral:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400",  label: "Neutral"  },
}

const CATEGORY_OPTIONS = ["All", "Mentor Quality", "Session Quality", "Platform Issue", "AI Assistant"]
const SENTIMENT_OPTIONS = ["All", "positive", "negative", "neutral"]

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          className={n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs font-body space-y-1">
        <p className="font-bold text-[#0A1931] mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminFeedbackDashboard() {
  const [search,    setSearch]    = useState("")
  const [category,  setCategory]  = useState("All")
  const [sentiment, setSentiment] = useState("All")
  const [showCatDrop, setShowCatDrop]  = useState(false)
  const [showSentDrop, setShowSentDrop] = useState(false)

  const filtered = feedbackItems.filter(f => {
    const matchSearch = !search ||
      f.user.toLowerCase().includes(search.toLowerCase()) ||
      f.comment.toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase())
    const matchCat  = category  === "All" || f.category  === category
    const matchSent = sentiment === "All" || f.sentiment === sentiment
    return matchSearch && matchCat && matchSent
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── 1. Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#0A1931]">Feedback Dashboard</h1>
          <p className="font-body text-sm text-gray-400 mt-1">
            Monitor platform-wide student and mentor feedback
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-body text-gray-400 font-semibold uppercase tracking-wide">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── 2. Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {feedbackStats.map((card) => {
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
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {card.label}
                </p>
                <p className="font-heading text-xl font-extrabold text-[#0A1931] mt-0.5">
                  {card.value}
                </p>
                <p className={`font-body text-[10px] font-semibold mt-0.5 ${card.changeBg}`}>
                  {card.change}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 3. Trend Chart + Sentiment Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
            <div>
              <h2 className="font-heading text-sm font-bold text-[#0A1931]">Feedback Trends</h2>
              <p className="font-body text-[10px] text-gray-400 mt-0.5">Weekly sentiment distribution</p>
            </div>
            <TrendingUp size={16} className="text-[#4A7FA7]" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="positive"
                stroke="#22C55E" strokeWidth={2.5}
                dot={{ r: 3, fill: "#22C55E" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="neutral"
                stroke="#F59E0B" strokeWidth={2}
                dot={{ r: 3, fill: "#F59E0B" }}
                strokeDasharray="4 2"
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="negative"
                stroke="#EF4444" strokeWidth={2}
                dot={{ r: 3, fill: "#EF4444" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 font-body text-[10px]">
            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
              <span className="w-3 h-0.5 bg-green-500 rounded-full inline-block" /> Positive
            </span>
            <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" /> Neutral
            </span>
            <span className="flex items-center gap-1.5 text-red-500 font-semibold">
              <span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" /> Negative
            </span>
          </div>
        </div>

        {/* Sentiment breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
            <h2 className="font-heading text-sm font-bold text-[#0A1931]">Sentiment Breakdown</h2>
            <BarChart2 size={16} className="text-[#4A7FA7]" />
          </div>

          <div className="space-y-5">
            {[
              { label: "Positive", value: 71.7, count: 1324, color: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
              { label: "Neutral",  value: 18.2, count: 336,  color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
              { label: "Negative", value: 10.1, count: 187,  color: "bg-red-500",   text: "text-red-700",   bg: "bg-red-50"   },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="font-body text-xs font-semibold text-gray-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-body text-[10px] font-semibold ${s.text} ${s.bg} px-1.5 py-0.5 rounded-md`}>
                      {s.count}
                    </span>
                    <span className="font-heading text-sm font-bold text-[#0A1931]">{s.value}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} transition-all duration-500`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
            <div className="bg-[#F6FAFD] rounded-xl p-3 text-center">
              <span className="font-heading text-lg font-extrabold text-[#0A1931]">4.6</span>
              <p className="font-body text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Avg Rating</p>
            </div>
            <div className="bg-[#F6FAFD] rounded-xl p-3 text-center">
              <span className="font-heading text-lg font-extrabold text-green-600">89.9%</span>
              <p className="font-body text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Feedback Feed with Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3
          px-6 py-4 border-b border-gray-50">
          <h2 className="font-heading text-base font-bold text-[#0A1931] flex items-center gap-2">
            Feedback Feed
            <span className="font-body text-xs font-semibold bg-[#EBF3F9] text-[#1A3D63]
              px-2.5 py-0.5 rounded-full border border-[#D5E6F2]">
              {filtered.length} items
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl
                  font-body text-xs text-gray-700 focus:outline-none focus:border-[#4A7FA7]
                  transition-colors w-44"
              />
            </div>

            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowCatDrop(v => !v); setShowSentDrop(false) }}
                className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 bg-gray-50 border border-gray-100
                  rounded-xl font-body text-xs font-semibold text-gray-600 hover:border-gray-200
                  transition-colors"
              >
                <Filter size={12} />
                {category === "All" ? "Category" : category}
                <ChevronDown size={12} />
              </button>
              {showCatDrop && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl
                  shadow-lg z-10 py-1 min-w-max">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setCategory(opt); setShowCatDrop(false) }}
                      className={`w-full text-left px-4 py-2 font-body text-xs transition-colors
                        ${category === opt
                          ? "bg-[#EBF3F9] text-[#1A3D63] font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sentiment dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowSentDrop(v => !v); setShowCatDrop(false) }}
                className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 bg-gray-50 border border-gray-100
                  rounded-xl font-body text-xs font-semibold text-gray-600 hover:border-gray-200
                  transition-colors capitalize"
              >
                <Minus size={12} />
                {sentiment === "All" ? "Sentiment" : sentiment}
                <ChevronDown size={12} />
              </button>
              {showSentDrop && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl
                  shadow-lg z-10 py-1 min-w-max">
                  {SENTIMENT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSentiment(opt); setShowSentDrop(false) }}
                      className={`w-full text-left px-4 py-2 font-body text-xs transition-colors capitalize
                        ${sentiment === opt
                          ? "bg-[#EBF3F9] text-[#1A3D63] font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {opt === "All" ? "All Sentiments" : opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback list */}
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="font-body text-sm text-gray-400">No feedback matches your filters.</p>
            </div>
          ) : (
            filtered.map((fb) => {
              const sent = SENTIMENT_COLORS[fb.sentiment]
              return (
                <div key={fb.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-full ${fb.avatarBg} text-white text-xs font-bold
                      font-heading flex items-center justify-center flex-shrink-0`}>
                      {fb.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-body text-sm font-semibold text-[#0A1931]">
                            {fb.user}
                          </span>
                          <span className="font-body text-[10px] text-gray-400 bg-gray-50
                            border border-gray-100 px-2 py-0.5 rounded-md">
                            {fb.role}
                          </span>
                          <span className="font-body text-[10px] text-[#4A7FA7] bg-[#EBF3F9]
                            border border-[#D5E6F2] px-2 py-0.5 rounded-md font-semibold">
                            {fb.subject}
                          </span>
                          {fb.mentor && (
                            <span className="font-body text-[10px] text-gray-500">
                              → {fb.mentor}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StarRow rating={fb.rating} />
                          <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-md border
                            ${sent.bg} ${sent.text} ${sent.border}`}>
                            {sent.label}
                          </span>
                        </div>
                      </div>
                      <p className="font-body text-sm text-gray-600 leading-relaxed">{fb.comment}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-body text-[10px] text-gray-300 font-semibold uppercase tracking-wide">
                          {fb.category}
                        </span>
                        <span className="font-body text-[10px] text-gray-400">{fb.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
