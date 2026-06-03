import { Link } from "react-router-dom"
import heroImage from "../assets/images/hero.jpg"
import smartScheduling from "../assets/icons/smart_scheduling.png"
import mentor from "../assets/icons/mentor.png"
import AI from "../assets/icons/AI.png"
import progress from "../assets/icons/progress.png"
import studyMaterials from "../assets/icons/study_materials.png"
import notification from "../assets/icons/notification.png"
import profile from "../assets/icons/profile.png"
import setting from "../assets/icons/setting.png"
import rocket from "../assets/icons/rocket (1).png"

// ─── Data ───────────────────────────────────────────────
const features = [
  {
    icon: smartScheduling,
    title: "Smart Scheduling",
    description:
      "Auto-generate optimized study plans based on deadlines, difficulty, and your available time.",
  },
  {
    icon: mentor,
    title: "Mentor & Peer Support",
    description:
      "Connect with mentors and peers for guidance on challenging subjects through our learning network.",
  },
  {
    icon: AI,
    title: "AI Study Assistant",
    description:
      "Get intelligent Q&A, study recommendations, and personalized guidance powered by AI.",
  },
  {
    icon: progress,
    title: "Progress Analytics",
    description:
      "Visualize study habits, track performance trends, and identify areas for improvement.",
  },
  {
    icon: studyMaterials,
    title: "Study Materials",
    description:
      "Upload, organize, and share notes, assignments, and resources with your study circle.",
  },
  {
    icon: notification,
    title: "Smart Notifications",
    description:
      "Never miss a deadline with timely reminders for exams, assignments, and study sessions.",
  },
]

const steps = [
  {
    number: "01",
    icon: profile,
    title: "Create Your Profile",
    description:
      "Sign up, add your subjects, deadlines, and set your available study hours.",
  },
  {
    number: "02",
    icon: setting,
    title: "Get Your Smart Schedule",
    description:
      "Learnify auto-generates a personalized timetable based on your priorities and difficulty levels.",
  },
  {
    number: "03",
    icon: rocket,
    title: "Learn & Grow",
    description:
      "Follow your plan, connect with mentors, use AI help, and track your progress to ace your exams.",
  },
]

// ─── Component ──────────────────────────────────────────
function LandingPage() {
  return (
    <div className="w-full">

      {/* ── Hero Section ── */}
      <section className="bg-[#F6FAFD] px-10 py-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row
          items-center justify-between gap-10">

          {/* Left — Text */}
          <div className="flex-1 space-y-6">
            <h1 className="font-heading text-5xl font-bold text-[#0A1931] leading-tight">
              Learnify <br />
              Study <br />
              Smarter, <br />
              <span className="text-[#4A7FA7]">Not Harder</span>
            </h1>
            <p className="font-body text-gray-600 text-base max-w-sm leading-relaxed">
              Learnify generates personalized study schedules, connects you
              with mentors & peers, and tracks your progress — all in one place.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/register"
                className="font-body text-sm font-medium bg-[#1A3D63]
                  text-white px-6 py-3 rounded-lg hover:bg-[#4A7FA7]
                  transition-colors duration-200"
              >
                Start Learning
              </Link>
              <Link
                to="#how-it-works"
                className="font-body text-sm font-medium border border-[#1A3D63]
                  text-[#1A3D63] px-6 py-3 rounded-lg hover:bg-[#1A3D63]
                  hover:text-white transition-colors duration-200"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="flex-1 flex justify-center">
            <img
              src={heroImage}
              alt="Learnify Hero"
              className="w-full max-w-md rounded-2xl object-cover shadow-lg"
            />
          </div>

        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-white px-10 py-20">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12 space-y-3">
            <p className="font-body text-sm font-medium text-[#4A7FA7]">
              Features
            </p>
            <h2 className="font-heading text-3xl font-bold text-[#0A1931]">
              Everything You Need to Excel
            </h2>
            <p className="font-body text-gray-500 text-sm max-w-md mx-auto">
              A complete toolkit designed to transform how university students
              manage their academic journey.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#F6FAFD] rounded-2xl p-6 space-y-4
                  hover:shadow-md transition-shadow duration-200"
              >
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="w-16 h-16 object-contain"
                />
                <h3 className="font-heading text-base font-semibold text-[#1A3D63]">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="bg-[#B3CFE5] px-10 py-20">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12 space-y-3">
            <p className="font-body text-sm font-medium text-[#1A3D63]">
              How It Works
            </p>
            <h2 className="font-heading text-3xl font-bold text-[#0A1931]">
              Three Simple Steps
            </h2>
            <p className="font-body text-sm text-[#1A3D63] max-w-md mx-auto">
              Get started in minutes and transform your study routine.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center text-center space-y-4"
              >
                {/* Numbered Icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#1A3D63]
                    flex items-center justify-center shadow-lg">
                    <img
                      src={step.icon}
                      alt={step.title}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6
                    rounded-full bg-[#4A7FA7] flex items-center justify-center
                    font-heading text-xs font-bold text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-heading text-base font-semibold text-[#0A1931]">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-[#1A3D63] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-white px-10 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-3xl font-bold text-[#0A1931]">
            Ready to Transform Your Study Routine?
          </h2>
          <p className="font-body text-sm text-gray-500 leading-relaxed">
            Join Learnify today and experience smarter scheduling,
            AI-powered guidance, and a supportive learning community.
          </p>
          <Link
            to="/register"
            className="inline-block font-body text-sm font-medium
              bg-[#1A3D63] text-white px-8 py-3 rounded-lg
              hover:bg-[#4A7FA7] transition-colors duration-200"
          >
            Get Started Now
          </Link>
        </div>
      </section>

    </div>
  )
}

export default LandingPage