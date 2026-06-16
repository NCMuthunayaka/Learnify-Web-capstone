import { useState, useEffect } from "react";

const DUE_STYLES = {
  urgent: "bg-[#fdecea] text-[#c0392b]",
  soon:   "bg-[#fff3e0] text-[#b86a00]",
  ok:     "bg-[#deeef8] text-[#4A7FA7]",
};

export function UpcomingTasks({ tasks: initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);

  // Sync if prop changes (parent reloads data)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggle = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="h-full bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E3F0]">
        <div>
          <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Upcoming Tasks
          </div>
          <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Next 7 days
          </div>
        </div>
        <button className="text-[12px] font-semibold text-[#4A7FA7] bg-[#deeef8] px-3 py-1.5 rounded-[7px] hover:bg-[#cce3f3] transition-colors cursor-pointer border-none">
          + Add
        </button>
      </div>

      {/* List */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="text-[13px] text-[#8AAABF] text-center py-6" style={{ fontFamily: "Inter, sans-serif" }}>
            No upcoming tasks 🎉
          </p>
        ) : (
          tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[11px] bg-[#F6FAFD] border border-[#D0E3F0] hover:bg-[#E4EEF7] transition-colors cursor-default"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggle(t.id)}
              className={`
                w-[19px] h-[19px] rounded-[5px] flex items-center justify-center shrink-0 border-2 transition-all
                ${t.done
                  ? "bg-[#1a8a4a] border-[#1a8a4a]"
                  : "border-[#D0E3F0] hover:border-[#4A7FA7]"
                }
              `}
            >
              {t.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-semibold text-[#0A1931] truncate"
                style={{
                  fontFamily: "Inter, sans-serif",
                  textDecoration: t.done ? "line-through" : "none",
                  opacity: t.done ? 0.55 : 1,
                }}
              >
                {t.name}
              </div>
              <div className="text-[11px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                {t.subject}
              </div>
            </div>

            {/* Due badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap ${DUE_STYLES[t.dueType]}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t.due}
            </span>
          </div>
        )))}
      </div>
    </div>
  );
}

// ── StudyStreak ───────────────────────────────────────────────────────────────
// Grid heat-map calendar for daily study consistency
const INTENSITY = {
  0: "bg-[#E4EEF7]",
  1: "bg-[#cde0f0]",
  2: "bg-[#a8cbea]",
  3: "bg-[#6fa8d0]",
  4: "bg-[#4A7FA7]",
  5: "bg-[#1A3D63]",
};

// rows[week][day 0=Mon..6=Sun] = intensity 0-5
export function StudyStreak({ streakDays = 0, bestDays = 0, weeks = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]] }) {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="h-full bg-white rounded-[18px] border border-[#D0E3F0] overflow-hidden shadow-[0_2px_8px_rgba(10,25,49,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D0E3F0]">
        <div>
          <div className="text-[15px] font-bold text-[#0A1931]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Study Streak
          </div>
          <div className="text-[12px] text-[#8AAABF] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Daily consistency — April
          </div>
        </div>
        <span className="text-[20px] font-extrabold text-[#c8900a]" style={{ fontFamily: "Poppins, sans-serif" }}>
          🔥 {streakDays}
        </span>
      </div>

      {/* Calendar grid */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-7 gap-[5px]">
          {/* Day headers */}
          {days.map((d) => (
            <div
              key={d}
              className="text-[10px] font-bold text-[#8AAABF] text-center pb-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {d}
            </div>
          ))}
          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((intensity, di) => {
              const isToday = wi === weeks.length - 1 && di === 2;
              return (
                <div
                  key={`${wi}-${di}`}
                  className={`
                    aspect-square rounded-[5px]
                    ${INTENSITY[intensity] ?? "bg-[#E4EEF7]"}
                    ${isToday ? "ring-2 ring-[#4A7FA7]" : ""}
                  `}
                />
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[["#E4EEF7","None"],["#cde0f0","1-2h"],["#4A7FA7","3-4h"],["#1A3D63","5h+"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: c }} />
              <span className="text-[12px] text-[#4A6880]" style={{ fontFamily: "Inter, sans-serif" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UpcomingTasks;
