import { Link }   from "react-router-dom"
import profile    from "../assets/icons/profile.png"
import setting    from "../assets/icons/setting.png"
import rocket     from "../assets/icons/rocket (1).png"
import mentor     from "../assets/icons/mentor.png"
import AI         from "../assets/icons/AI.png"
import progress   from "../assets/icons/progress.png"

const steps = [
  {
    number:      "01",
    icon:        profile,
    title:       "Create Your Profile",
    description: "Sign up with your email or Google account. Add your subjects, set your weekly study hours, and tell us your upcoming deadlines and exam dates.",
    details:     ["Choose Student or Mentor role", "Add subjects and difficulty levels", "Set available study hours per week", "Import deadlines and exam dates"],
  },
  {
    number:      "02",
    icon:        setting,
    title:       "Get Your Smart Schedule",
    description: "Learnify auto-generates a personalized timetable based on your priorities and difficulty levels. Our AI balances your workload so you never feel overwhelmed.",
    details:     ["AI analyzes subject difficulty", "Balances sessions across free time", "Prioritizes urgent deadlines", "Adapts as you complete sessions"],
  },
  {
    number:      "03",
    icon:        rocket,
    title:       "Learn & Grow",
    description: "Follow your plan, connect with mentors, use AI help, and track your progress to ace your exams. Everything you need is in one place.",
    details:     ["Follow daily study sessions", "Request help from mentors", "Use AI assistant anytime", "Track progress with analytics"],
  },
]

const extraFeatures = [
  { icon: mentor,   title: "Connect with Mentors",   desc: "Request targeted help from verified mentors in your subject area." },
  { icon: AI,       title: "AI-Powered Guidance",    desc: "Ask questions and get instant study recommendations from our AI." },
  { icon: progress, title: "Track Your Progress",    desc: "Visualize your study streak, focus score and semester goal progress." },
]

function HowItWorksPage() {
  return (
    <div className="w-full">

      {/* Hero */}
      <section className="bg-[#0A1931] px-10 py-20 text-center text-white">
        <p className="font-body text-sm text-[#B3CFE5] mb-3">
          Simple Process
        </p>
        <h1 className="font-heading text-4xl font-bold mb-4">
          How Learnify Works
        </h1>
        <p className="font-body text-[#B3CFE5] text-sm max-w-lg mx-auto leading-relaxed">
          Get started in minutes. No complicated setup — just sign up,
          add your subjects, and let Learnify handle the rest.
        </p>
      </section>

      {/* Steps */}
      <section className="bg-[#F6FAFD] px-10 py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          {steps.map((step, index) => (
            <div key={step.number}
              className={`flex flex-col md:flex-row items-center gap-10
                ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}>

              {/* Icon Side */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#1A3D63]
                    flex items-center justify-center shadow-lg">
                    <img src={step.icon} alt={step.title}
                      className="w-12 h-12 object-contain" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8
                    rounded-full bg-[#4A7FA7] flex items-center justify-center
                    font-heading text-sm font-bold text-white">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content Side */}
              <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm
                border border-gray-100">
                <h3 className="font-heading text-xl font-bold text-[#0A1931] mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed mb-4">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full
                        bg-[#4A7FA7] flex-shrink-0" />
                      <span className="font-body text-xs text-gray-600">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Extra Features Row */}
      <section className="bg-[#B3CFE5] px-10 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]
            text-center mb-10">
            Plus Much More
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {extraFeatures.map((f) => (
              <div key={f.title}
                className="bg-white rounded-2xl p-5 text-center
                  shadow-sm flex flex-col items-center gap-3">
                <img src={f.icon} alt={f.title}
                  className="w-12 h-12 object-contain" />
                <h4 className="font-heading text-sm font-semibold text-[#1A3D63]">
                  {f.title}
                </h4>
                <p className="font-body text-xs text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-10 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-[#0A1931] mb-4">
          Ready to get started?
        </h2>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register"
            className="font-body text-sm font-medium bg-[#1A3D63]
              text-white px-8 py-3 rounded-lg hover:bg-[#4A7FA7]
              transition-colors duration-200">
            Create Free Account
          </Link>
          <Link to="/features"
            className="font-body text-sm font-medium border border-[#1A3D63]
              text-[#1A3D63] px-8 py-3 rounded-lg hover:bg-[#1A3D63]
              hover:text-white transition-colors duration-200">
            View All Features
          </Link>
        </div>
      </section>

    </div>
  )
}

export default HowItWorksPage