import { useEffect, useRef } from "react";

// ── Chart.js loader ──────────────────────────────────────────────────────────
function loadChartJs(cb) {
  if (window.Chart) { cb(window.Chart); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
  s.onload = () => cb(window.Chart);
  document.head.appendChild(s);
}

// ── AIInsights ───────────────────────────────────────────────────────────────
const INSIGHTS = [
  {
    type: "tip",
    icon: "⚡",
    text: (
      <>
        Your peak focus window is <strong className="text-[#0A1931]">9–11 AM</strong>. Schedule your hardest
        subjects (Calculus, SE) in this slot for maximum retention.
      </>
    ),
    badge: "Schedule Tip",
    topBar: "linear-gradient(90deg,#4A7FA7,#B3CFE5)",
    badgeStyle: "bg-[#deeef8] text-[#4A7FA7]",
  },
  {
    type: "warn",
    icon: "⚠️",
    text: (
      <>
        Software Engineering is at <strong className="text-[#0A1931]">45%</strong> — 3 weeks behind target.
        Recommend adding 2 extra sessions this week to catch up.
      </>
    ),
    badge: "At Risk",
    topBar: "linear-gradient(90deg,#b86a00,#f0b94a)",
    badgeStyle: "bg-[#fff3e0] text-[#b86a00]",
  },
  {
    type: "achieve",
    icon: "🏆",
    text: (
      <>
        You're only <strong className="text-[#0A1931]">270 points</strong> behind Rank 3. Completing this
        week's quizzes could push you into the top 3 leaderboard.
      </>
    ),
    badge: "Achievement",
    topBar: "linear-gradient(90deg,#1a8a4a,#5dd87a)",
    badgeStyle: "bg-[#e6f7ed] text-[#1a8a4a]",
  },
];

export function AIInsights({ subjectProgress = [] }) {
  // Build dynamic insights from real data
  const sorted = [...subjectProgress].sort((a, b) => a.pct - b.pct);
  const lowest  = sorted[0];
  const highest = sorted[sorted.length - 1];

  const insights = [
    {
      type: "tip",
      icon: "⚡",
      text: (
        <>
          Your peak focus window is <strong className="text-[#0A1931]">9–11 AM</strong>. Schedule your hardest
          subjects in this slot for maximum retention.
        </>
      ),
      badge: "Schedule Tip",
      topBar: "linear-gradient(90deg,#4A7FA7,#B3CFE5)",
      badgeStyle: "bg-[#deeef8] text-[#4A7FA7]",
    },
    lowest ? {
      type: "warn",
      icon: "⚠️",
      text: (
        <>
          <strong className="text-[#0A1931]">{lowest.name}</strong> is at only{" "}
          <strong className="text-[#0A1931]">{lowest.pct}%</strong> completion.
          Recommend adding extra study sessions this week to catch up.
        </>
      ),
      badge: "At Risk",
      topBar: "linear-gradient(90deg,#b86a00,#f0b94a)",
      badgeStyle: "bg-[#fff3e0] text-[#b86a00]",
    } : {
      type: "warn",
      icon: "⚠️",
      text: <>Complete some tasks to see personalised risk alerts.</>,
      badge: "At Risk",
      topBar: "linear-gradient(90deg,#b86a00,#f0b94a)",
      badgeStyle: "bg-[#fff3e0] text-[#b86a00]",
    },
    highest ? {
      type: "achieve",
      icon: "🏆",
      text: (
        <>
          Great work on <strong className="text-[#0A1931]">{highest.name}</strong>!
          You're at <strong className="text-[#0A1931]">{highest.pct}%</strong> completion — keep it up!
        </>
      ),
      badge: "Achievement",
      topBar: "linear-gradient(90deg,#1a8a4a,#5dd87a)",
      badgeStyle: "bg-[#e6f7ed] text-[#1a8a4a]",
    } : {
      type: "achieve",
      icon: "🏆",
      text: <>Finish your first tasks to unlock achievement insights.</>,
      badge: "Achievement",
      topBar: "linear-gradient(90deg,#1a8a4a,#5dd87a)",
      badgeStyle: "bg-[#e6f7ed] text-[#1a8a4a]",
    },
  ];

  return (
    <div className="h-full bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E3F0]">
        <div>
          <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
            🤖 Personalised Recommendations
          </div>
          <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Generated based on your study patterns this month
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.type}
            className="relative rounded-[14px] border border-[#D0E3F0] bg-[#F6FAFD] p-5 overflow-hidden
                       hover:shadow-[0_4px_20px_rgba(10,25,49,0.10)] hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Top colour bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[14px]"
              style={{ background: ins.topBar }}
            />
            <div className="text-[24px] mb-2.5 mt-1">{ins.icon}</div>
            <p
              className="text-[13px] leading-relaxed text-[#4A6880]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {ins.text}
            </p>
            <span
              className={`inline-block mt-3 text-[10px] font-bold tracking-[0.8px] uppercase px-2.5 py-1 rounded-[5px] ${ins.badgeStyle}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {ins.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RecentActivity ────────────────────────────────────────────────────────────
const ACTIVITY = [
  { color: "bg-[#deeef8]", icon: "📚", title: "Completed Chapter 7",   desc: "Data Structures · 32 pages",   time: "2h ago"   },
  { color: "bg-[#e6f7ed]", icon: "✅", title: "Submitted Assignment",   desc: "DS Assignment 3",              time: "5h ago"   },
  { color: "bg-[#fff3e0]", icon: "🤖", title: "AI Session — 45 min",    desc: "Tree traversal concepts",      time: "Yesterday"},
  { color: "bg-[#fdecea]", icon: "📅", title: "Missed Study Slot",      desc: "Calculus · 2h unattended",     time: "Yesterday"},
  { color: "bg-[#deeef8]", icon: "💬", title: "Mentor Reply Received",  desc: "Networks — IPv6 question",     time: "Apr 17"   },
];

export function RecentActivity({ activities = [] }) {
  const displayActivities = activities.length > 0 ? activities : ACTIVITY;
  return (
    <div className="flex-1 bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)] flex flex-col">
      <div className="px-6 py-4 border-b border-[#D0E3F0] shrink-0">
        <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
          Recent Activity
        </div>
        <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
          Your latest actions
        </div>
      </div>
      <div className="px-6 divide-y divide-[#D0E3F0] flex-1 flex flex-col justify-center">
        {displayActivities.map((a, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px] shrink-0 ${a.color}`}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#0A1931]" style={{ fontFamily: "Inter, sans-serif" }}>
                {a.title}
              </div>
              <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                {a.desc}
              </div>
            </div>
            <div className="text-[11px] text-[#8AAABF] whitespace-nowrap mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
              {a.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ClassLeaderboard ──────────────────────────────────────────────────────────
const LB_ENTRIES = [
  { rank: 1, rankClass: "text-[#c8900a]", initials: "AS", name: "Asel Silva",       pts: "2,480", isMe: false },
  { rank: 2, rankClass: "text-[#7a8fa0]", initials: "RJ", name: "Ravi Jayawardena", pts: "2,210", isMe: false },
  { rank: 3, rankClass: "text-[#b07040]", initials: "NF", name: "Nuha Farouk",      pts: "2,090", isMe: false },
  { rank: 4, rankClass: "text-[#4A7FA7]", initials: "DK", name: "You",              pts: "1,940", isMe: true  },
  { rank: 5, rankClass: "text-[#8AAABF]", initials: "KP", name: "Kasun Perera",     pts: "1,820", isMe: false },
];

export function ClassLeaderboard({ entries = [] }) {
  const displayEntries = entries.length > 0 ? entries.slice(0, 5) : LB_ENTRIES;
  return (
    <div className="flex-1 bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)] flex flex-col">
      <div className="px-6 py-4 border-b border-[#D0E3F0] shrink-0">
        <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
          Class Leaderboard
        </div>
        <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
          Top students this month
        </div>
      </div>
      <div className="px-5 pt-4 pb-6 flex-1 flex flex-col justify-center gap-2">
        {displayEntries.map((e) => (
          <div
            key={e.rank}
            className={`flex items-center gap-3 px-3 py-2 rounded-[11px] border transition-colors
              ${e.isMe
                ? "bg-[#deeef8] border-[#a8cbea]"
                : "bg-[#F6FAFD] border-[#D0E3F0] hover:bg-[#E4EEF7]"
              }`}
          >
            <span
              className={`w-5 text-center text-[13px] font-extrabold shrink-0 ${e.rankClass}`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {e.rank}
            </span>
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-[#0A1931] shrink-0"
              style={{
                background: "linear-gradient(135deg,#4A7FA7,#B3CFE5)",
                boxShadow: e.isMe ? "0 0 0 2px #4A7FA7" : "none",
              }}
            >
              {e.initials}
            </div>
            <span
              className="flex-1 text-[13px] font-semibold text-[#0A1931] truncate"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: e.isMe ? 700 : 600 }}
            >
              {e.name}
            </span>
            <span
              className="text-[13px] font-bold text-[#4A7FA7]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {e.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MonthlyScoreChart ──────────────────────────────────────────────────────────
export function MonthlyScoreChart({ chartData }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    loadChartJs((Chart) => {
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const labels = chartData?.labels || ["Data Struct.", "Calculus", "Databases", "Soft. Eng.", "Networks", "Op. Systems"];
      const datasets = chartData?.datasets || [
        { label: "Jan", data: [72,65,78,50,80,60], backgroundColor: "rgba(179,207,229,0.75)", borderRadius: 5 },
        { label: "Feb", data: [78,70,82,55,85,65], backgroundColor: "rgba(74,127,167,0.65)",  borderRadius: 5 },
        { label: "Mar", data: [85,74,88,60,90,70], backgroundColor: "#1A3D63",                borderRadius: 5 },
      ];

      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: "#4A6880",
                font: { size: 11, family: "Inter" },
                boxWidth: 10,
                boxHeight: 10,
              },
            },
            tooltip: {
              backgroundColor: "#fff",
              borderColor: "#D0E3F0",
              borderWidth: 1,
              titleColor: "#0A1931",
              bodyColor: "#4A6880",
              padding: 10,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#8AAABF", font: { size: 11, family: "Inter" } },
            },
            y: {
              grid: { color: "rgba(208,227,240,0.7)" },
              ticks: { color: "#8AAABF", font: { size: 11, family: "Inter" } },
              min: 0,
              max: 100,
            },
          },
        },
      });
    });
    return () => chartRef.current?.destroy();
  }, [chartData]);

  return (
    <div className="h-full bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E3F0] shrink-0">
        <div>
          <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Monthly Score Trend
          </div>
          <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Assignment &amp; quiz scores across subjects
          </div>
        </div>
        <button className="text-[12px] font-semibold text-[#4A7FA7] bg-[#deeef8] px-3 py-1.5 rounded-[7px] hover:bg-[#cce3f3] transition-colors cursor-pointer border-none">
          Full Report
        </button>
      </div>
      <div className="flex-1 w-full relative min-h-[350px]">
        <div className="absolute inset-0 px-6 py-5">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

export default AIInsights;
