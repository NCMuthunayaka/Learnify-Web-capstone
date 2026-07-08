import smartScheduling from "../assets/icons/smart_scheduling.png"
import mentor          from "../assets/icons/mentor.png"
import AI              from "../assets/icons/AI.png"
import progress        from "../assets/icons/progress.png"
import studyMaterials  from "../assets/icons/study_materials.png"
import notification    from "../assets/icons/notification.png"
import { Link }        from "react-router-dom"

const features = [
  {
    icon:        smartScheduling,
    title:       "Smart Scheduling",
    description: "Auto-generate optimized study plans based on deadlines, difficulty, and your available time. Our AI engine analyzes your workload and distributes study sessions across your free hours for maximum retention.",
    benefit:     "Save 2+ hours weekly on planning",
  },
  {
    icon:        mentor,
    title:       "Mentor & Peer Support",
    description: "Connect with mentors and peers for guidance on challenging subjects through our learning network. Request targeted help, share resources, and grow together.",
    benefit:     "Access 50+ verified mentors",
  },
  {
    icon:        AI,
    title:       "AI Study Assistant",
    description: "Get intelligent Q&A, study recommendations, and personalized guidance powered by AI. Ask anything about your subjects and get instant, accurate answers.",
    benefit:     "Available 24/7, no waiting",
  },
  {
    icon:        progress,
    title:       "Progress Analytics",
    description: "Visualize study habits, track performance trends, and identify areas for improvement. See your weekly study hours, streak, focus score and semester goal progress.",
    benefit:     "Data-driven improvement",
  },
  {
    icon:        studyMaterials,
    title:       "Study Materials",
    description: "Upload, organize, and share notes, assignments, and resources with your study circle. Mentors upload verified materials, peers share notes — all in one searchable library.",
    benefit:     "Thousands of resources",
  },
  {
    icon:        notification,
    title:       "Smart Notifications",
    description: "Never miss a deadline with timely reminders for exams, assignments, and study sessions. Get notified when new resources are uploaded, mentors respond, or deadlines approach.",
    benefit:     "Zero missed deadlines",
  },
]

function FeaturesPage() {
  return (
    <div className="w-full">

      {/* Hero */}
      <section className="bg-[#0A1931] px-10 py-20 text-center text-white">
        <p className="font-body text-sm text-[#B3CFE5] mb-3">
          What We Offer
        </p>
        <h1 className="font-heading text-4xl font-bold mb-4">
          Features Built for Students
        </h1>
        <p className="font-body text-[#B3CFE5] text-sm max-w-lg mx-auto leading-relaxed">
          Every feature in Learnify is designed around one goal —
          helping you study smarter and achieve more.
        </p>
      </section>

      {/* Features Grid */}
      <section className="bg-[#F6FAFD] px-10 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title}
              className="bg-white rounded-2xl p-6 space-y-4
                shadow-sm border border-gray-100
                hover:shadow-md transition-shadow duration-200">
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
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="w-2 h-2 rounded-full bg-[#4A7FA7]" />
                <span className="font-body text-xs text-[#4A7FA7] font-medium">
                  {feature.benefit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-10 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-[#0A1931] mb-4">
          Ready to experience all these features?
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

export default FeaturesPage