import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", subject: "", message: ""
  })

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    // ✅ Real send — opens user's email client
    // Pre-fills recipient, subject and body
    const recipient = "learnify.official.edu@gmail.com"
    const subject   = encodeURIComponent(
      formData.subject || `Message from ${formData.name}`
    )
    const body      = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    )

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`
  }

  const contactInfo = [
    {
      icon:  MapPin,
      label: "Address",
      value: "No: 123/6, Ragammawatta, Kirindiwela",
    },
    {
      icon:  Phone,
      label: "Phone",
      value: "076 555 6756",
    },
    {
      icon:  Mail,
      label: "Email",
      value: "learnify.official.edu@gmail.com",
    },
  ]

  const isValid = formData.name && formData.email && formData.message

  return (
    <div className="w-full">

      {/* Hero */}
      <section className="bg-[#0A1931] px-10 py-20 text-center text-white">
        <p className="font-body text-sm text-[#B3CFE5] mb-3">
          Get In Touch
        </p>
        <h1 className="font-heading text-4xl font-bold mb-4">
          Contact Us
        </h1>
        <p className="font-body text-[#B3CFE5] text-sm max-w-lg mx-auto">
          Have a question, suggestion or want to partner with us?
          We'd love to hear from you.
        </p>
      </section>

      {/* Contact Content */}
      <section className="bg-[#F6FAFD] px-10 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Left — Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#0A1931] mb-2">
                Let's talk
              </h2>
              <p className="font-body text-sm text-gray-500 leading-relaxed">
                We're a team of students building tools for students.
                Your feedback directly shapes what we build next.
              </p>
            </div>

            <div className="space-y-5">
              {contactInfo.map((info) => {
                const Icon = info.icon
                return (
                  <div key={info.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1A3D63] flex
                      items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-gray-400 uppercase
                        tracking-wider mb-0.5">
                        {info.label}
                      </p>
                      <p className="font-body text-sm text-[#0A1931] font-medium">
                        {info.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* University Note */}
            <div className="bg-[#1A3D63] rounded-2xl p-5 text-white">
              <p className="font-body text-xs text-[#B3CFE5] mb-1">
                Academic Project
              </p>
              <p className="font-body text-sm font-medium">
                Sabaragamuwa University of Sri Lanka
              </p>
              <p className="font-body text-xs text-[#B3CFE5] mt-1">
                Faculty of Computing · 2026
              </p>
            </div>
          </div>

          {/* Right — Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#0A1931]">
                  Send us a message
                </h3>
                <p className="font-body text-xs text-gray-400 mt-1">
                  Clicking Send will open your email client with the
                  message pre-filled.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs text-gray-500
                    mb-1.5 block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full border border-gray-200 rounded-lg
                      px-3 py-2.5 font-body text-sm text-gray-700
                      focus:outline-none focus:border-[#4A7FA7]"
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-gray-500
                    mb-1.5 block">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    className="w-full border border-gray-200 rounded-lg
                      px-3 py-2.5 font-body text-sm text-gray-700
                      focus:outline-none focus:border-[#4A7FA7]"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-xs text-gray-500
                  mb-1.5 block">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="w-full border border-gray-200 rounded-lg
                    px-3 py-2.5 font-body text-sm text-gray-700
                    focus:outline-none focus:border-[#4A7FA7]"
                />
              </div>

              <div>
                <label className="font-body text-xs text-gray-500
                  mb-1.5 block">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  className="w-full border border-gray-200 rounded-lg
                    px-3 py-2.5 font-body text-sm text-gray-700
                    focus:outline-none focus:border-[#4A7FA7]
                    resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full flex items-center justify-center gap-2
                  bg-[#1A3D63] hover:bg-[#4A7FA7] text-white font-body
                  text-sm font-medium py-3 rounded-lg transition-colors
                  duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={15} />
                Send Message
              </button>

            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

export default ContactPage