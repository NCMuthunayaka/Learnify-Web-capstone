// src/pages/DashboardPage.jsx
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

export default function ProgressPage() {
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
                    📅 April 2025 · Week 14 of 24
                </div>
            </div>

            <SectionLabel>Performance Overview</SectionLabel>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 items-stretch">
                <StatsCard
                    variant="highlight"
                    label="Overall Progress"
                    ringPct={72}
                    ringLabel="Semester Goal"
                    delta="↑ 4% from last month"
                />
                <StatsCard
                    label="Study Hours"
                    value="48"
                    valueSuffix="hrs"
                    delta="↑ 6 hrs vs last week"
                    deltaType="up"
                    iconColor="blue"
                    icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <StatsCard
                    label="Tasks Done"
                    value="34"
                    valueSuffix="/56"
                    delta="5 due this week"
                    deltaType="neutral"
                    iconColor="green"
                    icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="20 6 9 17 4 12" /></svg>}
                />
                <StatsCard
                    label="Study Streak"
                    value="14"
                    valueSuffix="days"
                    delta="🔥 Personal best!"
                    deltaType="up"
                    iconColor="amber"
                    icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
                />
            </div>

            <SectionLabel>Time Distribution &amp; Consistency</SectionLabel>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 items-stretch">
                <div className="lg:col-span-2">
                    <ProductivityChart />
                </div>
                <DonutChart />
            </div>

            {/* ── Tasks + Streak + Subject Progress ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 items-stretch">
                <UpcomingTasks />
                <StudyStreak />
                <SubjectProgress />
            </div>

            <SectionLabel>Insights &amp; Community</SectionLabel>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <div className="lg:col-span-2">
                    <MonthlyScoreChart />
                </div>
                <div className="flex flex-col gap-4">
                    <RecentActivity />
                    <ClassLeaderboard />
                </div>
            </div>

            <div className="mt-8">
                <SectionLabel>AI-Powered Insights</SectionLabel>
            </div>

            <div className="mt-1">
                <AIInsights />
            </div>
        </div>
    );
}