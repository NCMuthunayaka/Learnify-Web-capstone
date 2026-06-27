import { Link } from "react-router-dom"
import {
  Users, Lightbulb, Globe, Heart,
  GraduationCap, Clock, Star, BookOpen
} from "lucide-react"

const teamValues = [
  {
    icon:  Heart,
    color: "bg-red-100 text-red-500",
    title: "Student-First",
    desc:  "Every decision we make starts with one question — does this help students achieve more?",
  },
  {
    icon:  Users,
    color: "bg-blue-100 text-blue-500",
    title: "Community",
    desc:  "Learning is better together. We connect students with mentors and peers who genuinely care.",
  },
  {
    icon:  Lightbulb,
    color: "bg-yellow-100 text-yellow-500",
    title: "Innovation",
    desc:  "We use AI and data science to remove the guesswork from studying.",
  },
  {
    icon:  Globe,
    color: "bg-green-100 text-green-500",
    title: "Accessibility",
    desc:  "Quality education tools should be available to every student regardless of background.",
  },
]

const stats = [
  { icon: Users,          value: "500+",  label: "Students Helped"    },
  { icon: GraduationCap,  value: "50+",   label: "Verified Mentors"   },
  { icon: Clock,          value: "10K+",  label: "Study Hours Logged"  },
  { icon: Star,           value: "4.8★",  label: "Average Rating"      },
]

function AboutPage() {
  return (
    <div className="w-full">

      {/* Hero */}
      <section className="bg-[#0A1931] px-10 py-20 text-center text-white">
        <p className="font-body text-sm text-[#B3CFE5] mb-3">
          Our Story
        </p>
        <h1 className="font-heading text-4xl font-bold mb-4">
          About Learnify
        </h1>
        <p className="font-body text-[#B3CFE5] text-sm max-w-xl mx-auto leading-relaxed">
          Built by students, for students — at Sabaragamuwa University of Sri Lanka.
          We know the challenges of university life because we live them every day.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-white px-10 py-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row
          gap-12 items-center">

          {/* Text */}
          <div className="flex-1 space-y-5">
            <p className="font-body text-sm font-medium text-[#4A7FA7]">
              Our Mission
            </p>
            <h2 className="font-heading text-3xl font-bold text-[#0A1931]">
              Transforming How Students Learn
            </h2>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              Learnify was born out of a simple observation — university students
              spend more time managing their studies than actually studying. Between
              tracking deadlines, finding resources, and figuring out what to study
              next, the actual learning gets lost.
            </p>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              We built Learnify to solve exactly this. By automating scheduling,
              connecting students with the right mentors, and providing AI-powered
              guidance, we let students focus on what matters — learning.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label}
                  className="bg-[#F6FAFD] rounded-2xl p-6 text-center
                    border border-gray-100 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A3D63] flex
                    items-center justify-center mx-auto">
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="font-heading text-2xl font-bold text-[#1A3D63]">
                    {stat.value}
                  </p>
                  <p className="font-body text-xs text-gray-500">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* Values */}
      <section className="bg-[#F6FAFD] px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-sm font-medium text-[#4A7FA7] mb-2">
              What Drives Us
            </p>
            <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
              Our Core Values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamValues.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title}
                  className="bg-white rounded-2xl p-6 flex items-start gap-4
                    shadow-sm border border-gray-100
                    hover:shadow-md transition-shadow duration-200">
                  <div className={`w-12 h-12 rounded-xl flex items-center
                    justify-center flex-shrink-0 ${value.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold
                      text-[#1A3D63] mb-1">
                      {value.title}
                    </h3>
                    <p className="font-body text-sm text-gray-500 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* University Badge */}
      <section className="bg-[#1A3D63] px-10 py-12 text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-3">
          <BookOpen size={24} className="text-[#B3CFE5]" />
          <p className="font-body text-sm text-[#B3CFE5]">
            Proud to be a capstone project from
          </p>
        </div>
        <h3 className="font-heading text-xl font-bold">
          Sabaragamuwa University of Sri Lanka
        </h3>
        <p className="font-body text-sm text-[#B3CFE5] mt-2">
          Faculty of Computing · Department of Information Technology · 2026
        </p>
      </section>

      {/* CTA */}
      <section className="bg-white px-10 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-[#0A1931] mb-4">
          Join the Learnify community
        </h2>
        <Link to="/register"
          className="inline-block font-body text-sm font-medium
            bg-[#1A3D63] text-white px-8 py-3 rounded-lg
            hover:bg-[#4A7FA7] transition-colors duration-200">
          Get Started Free
        </Link>
      </section>

    </div>
  )
}

export default AboutPage