import { useEffect, useState } from "react";
import { getProgressSummary } from "../api/progressApi";
import StatsCard from "../components/Progress/StatsCard";
import ProductivityChart from "../components/Progress/ProductivityChart";
import { DonutChart, SubjectProgress } from "../components/Progress/DonutChart";
import { UpcomingTasks, StudyStreak } from "../components/Progress/UpcomingTasks";
import { AIInsights, RecentActivity, ClassLeaderboard, MonthlyScoreChart } from "../components/Progress/AIInsights";

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-3 mb-4 mt-2">
            <span
                className="text-[11px] font-bold tracking-[2px] uppercase text-[#4A7FA7] whitespace-nowrap"
                style={{ fontFamily: "Poppins, sans-serif" }}
            >
                {children}
            </span>
            <div className="h-px flex-1 bg-[#D0E3F0]" />
        </div>
    );
}

function Skeleton({ h = "h-32" }) {
    return <div className={`${h} bg-[#E4EEF7] rounded-[18px] animate-pulse`} />;
}

export default function ProgressPage() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        setLoading(true);
        getProgressSummary()
            .then((res) => setData(res.data))
            .catch(() => setError("Failed to load progress data."))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const weekNum = Math.ceil(
        ((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7
    );

    return (
        <div>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1
                        className="text-[26px] sm:text-[30px] font-extrabold leading-tight text-[#0A1931]"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Progress &amp; Analytics
                    </h1>
                    <p className="mt-1 text-[14px] text-[#4A6880]" style={{ fontFamily: "Inter, sans-serif" }}>
                        Track your academic performance and study habits
                    </p>
                </div>
                <div className="text-[13px] text-[#8AAABF] bg-white border border-[#D0E3F0] px-4 py-2 rounded-[10px] shadow-[0_2px_8px_rgba(10,25,49,0.05)]">
                    📅 {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Week {weekNum}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-5 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <SectionLabel>Performance Overview</SectionLabel>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 items-stretch">
                {loading ? (
                    [1,2,3,4].map(i => <Skeleton key={i} h="h-32" />)
                ) : (
                    <>
                        <StatsCard
                            variant="highlight"
                            label="Overall Progress"
                            ringPct={data?.stats?.overall_pct ?? 0}
                            ringLabel="Task Completion"
                            delta={`${data?.stats?.tasks_done ?? 0} of ${data?.stats?.tasks_total ?? 0} tasks done`}
                        />
                        <StatsCard
                            label="Study Hours"
                            value={String(data?.stats?.study_hours_month ?? 0)}
                            valueSuffix="hrs"
                            delta="This month"
                            deltaType="up"
                            iconColor="blue"
                            icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        />
                        <StatsCard
                            label="Tasks Done"
                            value={String(data?.stats?.tasks_done ?? 0)}
                            valueSuffix={`/${data?.stats?.tasks_total ?? 0}`}
                            delta={`${data?.stats?.tasks_due_week ?? 0} due this week`}
                            deltaType="neutral"
                            iconColor="green"
                            icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="20 6 9 17 4 12" /></svg>}
                        />
                        <StatsCard
                            label="Study Streak"
                            value={String(data?.streak_days ?? 0)}
                            valueSuffix="days"
                            delta={(data?.streak_days ?? 0) > 0 ? "🔥 Keep it up!" : "Start studying today!"}
                            deltaType={(data?.streak_days ?? 0) > 0 ? "up" : "neutral"}
                            iconColor="amber"
                            icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
                        />
                    </>
                )}
            </div>

            <SectionLabel>Time Distribution &amp; Consistency</SectionLabel>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 items-stretch">
                <div className="lg:col-span-2">
                    {loading
                        ? <Skeleton h="h-72" />
                        : <ProductivityChart
                            data={data?.study_chart ?? []}
                            subtitle={`Daily study hours — ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
                        />
                    }
                </div>
                {loading
                    ? <Skeleton h="h-72" />
                    : <DonutChart data={data?.time_alloc ?? []} />
                }
            </div>

            {/* ── Tasks + Streak + Subject Progress ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 items-stretch">
                {loading ? (
                    [1,2,3].map(i => <Skeleton key={i} h="h-64" />)
                ) : (
                    <>
                        <UpcomingTasks tasks={data?.tasks ?? []} />
                        <StudyStreak
                            streakDays={data?.streak_days ?? 0}
                            weeks={data?.heatmap ?? [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
                        />
                        <SubjectProgress subjects={data?.subject_progress ?? []} />
                    </>
                )}
            </div>

            <SectionLabel>Insights &amp; Community</SectionLabel>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <div className="lg:col-span-2">
                    <MonthlyScoreChart chartData={data?.monthly_scores} />
                </div>
                <div className="flex flex-col gap-4">
                    <RecentActivity activities={data?.recent_activity ?? []} />
                    <ClassLeaderboard entries={data?.leaderboard ?? []} />
                </div>
            </div>

            <div className="mt-8">
                <SectionLabel>AI-Powered Insights</SectionLabel>
            </div>

            <div className="mt-1">
                <AIInsights subjectProgress={data?.subject_progress ?? []} />
            </div>
        </div>
    );
}