import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import backgroundImage from "../../assets/images/background.jpg"

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    // TODO: Connect to backend later
    console.log("Login with:", formData)
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
      <div className="relative z-10 w-full max-w-2xl mx-6 flex rounded-2xl
                      overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">

        {/* Left — Welcome Text */}
        <div className="hidden md:flex flex-1 flex-col justify-center
          px-10 py-16 bg-transparent">
          <p className="font-body text-[#B3CFE5] text-md mb-2">
            Welcome Back To
          </p>
          <h1 className="font-heading text-6xl font-bold text-white mb-4">
            Learnify
          </h1>
          <p className="font-body text-[#B3CFE5] text-xs">
            Login to continue your learning journey.
          </p>
        </div>

        {/* Right — Login Form */}
        <div className="w-full md:w-96 bg-[#000000] bg-opacity-50
                        backdrop-blur-md px-10 py-12 flex flex-col justify-center space-y-6
                        border border-[#4A7FA7] border-opacity-30 shadow-2xl">

          {/* Title */}
          <h2 className="font-heading text-2xl font-semibold text-white
            text-center tracking-widest">
            LOGIN
          </h2>

          {/* Error Message */}
          {error && (
            <p className="font-body text-xs text-red-400 text-center">
              {error}
            </p>
          )}

          {/* Form */}
          <div className="space-y-4">

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

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="font-body text-xs text-[#B3CFE5]
                  hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                font-body text-sm font-medium py-3 rounded-lg
                transition-colors duration-200"
            >
              Login
            </button>

          </div>

          {/* Register Link */}
          <p className="font-body text-xs text-[#B3CFE5] text-center">
            Do Not have an account?{" "}
            <Link
              to="/register"
              className="text-[#4A7FA7] font-medium hover:text-white
                transition-colors"
            >
              Get Started
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default LoginPage