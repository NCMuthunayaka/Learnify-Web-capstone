import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import backgroundImage from "../../assets/images/background.jpg"
import { GraduationCap, Users } from "lucide-react"

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  })
  const [error, setError] = useState("")

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleRoleSelect(role) {
    setFormData({ ...formData, role })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.firstName || !formData.lastName ||
        !formData.email || !formData.password ||
        !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!formData.role) {
      setError("Please select a role")
      return
    }

    // TODO: Connect to backend later
    console.log("Register with:", formData)
    navigate("/dashboard")
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-6 flex
        rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">

        {/* Left — Welcome Text */}
        <div className="hidden md:flex flex-1 flex-col justify-center
          px-10 py-12 bg-transparent space-y-4">
          <h1 className="font-heading text-6xl font-bold text-white">
            Learnify
          </h1>
          <div className="font-heading text-2xl font-bold text-white space-y-1">
            <p>Plan better.</p>
            <p>Learn smarter.</p>
            <p>Achieve more.</p>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed max-w-xs">
            Create your Learnify account to access personalized study schedules,
            AI-powered assistance, and collaborative learning with mentors and peers.
          </p>
        </div>

        {/* Right — Register Form */}
        <div className="w-full md:w-96 bg-[#000000] bg-opacity-50
          backdrop-blur-md px-8 py-10 flex flex-col justify-center space-y-5
          border border-[#4A7FA7] border-opacity-30 shadow-2xl">

          {/* Title */}
          <h2 className="font-heading text-2xl font-semibold text-white
            text-center tracking-widest">
            REGISTER
          </h2>

          {/* Error Message */}
          {error && (
            <p className="font-body text-xs text-red-400 text-center">
              {error}
            </p>
          )}

          {/* Form */}
          <div className="space-y-3">

            {/* First Name */}
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-[#D9D9D9] bg-opacity-60 text-white
                placeholder-[#0A1832]/50 font-bold font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7]
                transition-colors duration-200"
            />

            {/* Last Name */}
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-[#D9D9D9] bg-opacity-60 text-white
                placeholder-[#0A1832]/50 font-bold font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7]
                transition-colors duration-200"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#D9D9D9] bg-opacity-60 text-white
                placeholder-[#0A1832]/50 font-bold font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7]
                transition-colors duration-200"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#D9D9D9] bg-opacity-60 text-white
                placeholder-[#0A1832]/50 font-bold font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7]
                transition-colors duration-200"
            />

            {/* Confirm Password */}
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-[#D9D9D9] bg-opacity-60 text-white
                placeholder-[#0A1832]/50 font-bold font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7]
                transition-colors duration-200"
            />

            {/* Role Selection */}
            <div className="space-y-2">
              <p className="font-body text-sm text-[#B3CFE5]">
                Choose your role
              </p>
              <div className="grid grid-cols-2 gap-3">

                {/* Student */}
                <button
                  onClick={() => handleRoleSelect("student")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-lg
                    border transition-all duration-200
                    ${formData.role === "student"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : "bg-[#D9D9D9] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#0A1832] hover:border-[#4A7FA7]"
                    }`}
                >
                  <GraduationCap size={28} />
                  <span className="font-body text-sm font-medium">Student</span>
                </button>

                {/* Mentor */}
                <button
                  onClick={() => handleRoleSelect("mentor")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-lg
                    border transition-all duration-200
                    ${formData.role === "mentor"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : "bg-[#D9D9D9] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#0A1832] hover:border-[#4A7FA7]"
                    }`}
                >
                  <Users size={28} />
                  <span className="font-body text-sm font-medium">Mentor</span>
                </button>

              </div>
            </div>

            {/* Register Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                font-body text-sm font-medium py-3 rounded-lg
                transition-colors duration-200"
            >
              Register
            </button>

          </div>

          {/* Login Link */}
          <p className="font-body text-xs text-[#B3CFE5] text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#4A7FA7] font-bold hover:text-white
                transition-colors"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default RegisterPage