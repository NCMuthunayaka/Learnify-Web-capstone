import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import backgroundImage from "../../assets/images/background.jpg"
import { GraduationCap, Users, Eye, EyeOff } from "lucide-react"
import { registerUser, googleAuth } from "../../api/authApi"
import { useAuth } from "../../hooks/useAuth"
import { useGoogleLogin } from "@react-oauth/google"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorMessage from "../../components/common/ErrorMessage"
import api from "../../api/axiosInstance"

function RegisterPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "", role: "",
  })
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError]       = useState("")

  // ── Google Role Selection State ────────────────────────
  // When Google auth returns a new user
  // we show a role selection screen
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [googleUserData, setGoogleUserData] = useState(null)
  const [selectedRole, setSelectedRole]     = useState("")
  const [roleLoading, setRoleLoading]       = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleRoleSelect(role) {
    setFormData({ ...formData, role })
  }

  // ── Normal Register ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

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

    try {
      setLoading(true)
      const fullName = `${formData.firstName} ${formData.lastName}`
      const response = await registerUser(
        fullName, formData.email, formData.password, formData.role
      )
      const { user, access_token, refresh_token } = response.data
      login(user, access_token, refresh_token)
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.error?.message || "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  // ── Google Register ────────────────────────────────────
  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGLoading(true)
        setError("")

        const response = await googleAuth(tokenResponse.access_token)
        const { user, access_token, refresh_token, is_new_user } = response.data

        if (is_new_user) {
          // New user — show role selection screen
          // Save data temporarily to use after role selection
          setGoogleUserData({ user, access_token, refresh_token })
          setShowRoleSelect(true)
        } else {
          // Existing user — login directly
          login(user, access_token, refresh_token)
          navigate("/dashboard")
        }

      } catch (err) {
        setError(err.response?.data?.error?.message || "Google signup failed.")
      } finally {
        setGLoading(false)
      }
    },
    onError: () => {
      setError("Google signup was cancelled or failed.")
    }
  })

  // ── Confirm Role After Google Auth ─────────────────────
  async function handleRoleConfirm() {
    if (!selectedRole) {
      setError("Please select a role to continue")
      return
    }

    try {
      setRoleLoading(true)
      setError("")

      // Save token temporarily to make the update request
      localStorage.setItem("access_token", googleUserData.access_token)

      // Update user role in backend
      await api.patch("/users/profile", { role: selectedRole })

      // Now login with updated user
      const updatedUser = { ...googleUserData.user, role: selectedRole }
      login(updatedUser, googleUserData.access_token, googleUserData.refresh_token)
      navigate("/dashboard")

    } catch (err) {
      setError("Failed to set role. Please try again.")
    } finally {
      setRoleLoading(false)
    }
  }

  // ── Role Selection Screen ──────────────────────────────
  // Shown after Google auth for new users
  if (showRoleSelect) {
    return (
      <div className="relative min-h-screen w-full flex items-center
        justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

        <div className="relative z-10 w-full max-w-md mx-6 bg-[#0A1931]
          bg-opacity-95 backdrop-blur-md rounded-2xl px-8 py-10
          border border-[#4A7FA7] border-opacity-30 shadow-2xl space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#4A7FA7] flex
              items-center justify-center mx-auto mb-4">
              <span className="font-heading text-2xl font-bold text-white">
                {googleUserData?.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-white">
              Welcome, {googleUserData?.user?.name?.split(" ")[0]}!
            </h2>
            <p className="font-body text-sm text-[#B3CFE5]">
              One last step — choose your role to continue
            </p>
          </div>

          {error && (
            <ErrorMessage message={error} onDismiss={() => setError("")} />
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <p className="font-body text-sm text-[#B3CFE5] text-center">
              I am a...
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRole("student")}
                className={`flex flex-col items-center gap-3 py-6
                  rounded-xl border-2 transition-all duration-200
                  ${selectedRole === "student"
                    ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                    : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5] hover:border-[#4A7FA7]"
                  }`}
              >
                <GraduationCap size={32} />
                <div className="text-center">
                  <p className="font-body text-sm font-semibold">Student</p>
                  <p className="font-body text-xs opacity-70 mt-0.5">
                    I want to learn
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("mentor")}
                className={`flex flex-col items-center gap-3 py-6
                  rounded-xl border-2 transition-all duration-200
                  ${selectedRole === "mentor"
                    ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                    : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5] hover:border-[#4A7FA7]"
                  }`}
              >
                <Users size={32} />
                <div className="text-center">
                  <p className="font-body text-sm font-semibold">Mentor</p>
                  <p className="font-body text-xs opacity-70 mt-0.5">
                    I want to teach
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleRoleConfirm}
            disabled={roleLoading || !selectedRole}
            className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
              font-body text-sm font-medium py-3 rounded-lg
              transition-colors duration-200 flex items-center
              justify-center gap-2 disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            {roleLoading
              ? <LoadingSpinner size="sm" color="white" />
              : "Continue to Learnify"
            }
          </button>

        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

      <div className="relative z-10 w-full max-w-3xl mx-6 flex
        rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">

        {/* Left */}
        <div className="hidden md:flex flex-1 flex-col justify-center
          px-10 py-12 bg-transparent space-y-4">
          <h1 className="font-heading text-5xl font-bold text-white">
            Learnify
          </h1>
          <div className="font-heading text-2xl font-bold text-white space-y-1">
            <p>Plan better.</p>
            <p>Learn smarter.</p>
            <p>Achieve more.</p>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed max-w-xs">
            Create your Learnify account to access personalized study
            schedules, AI-powered assistance, and collaborative learning.
          </p>
        </div>

        {/* Right */}
        <div className="w-full md:w-96 bg-[#0A1931] bg-opacity-95
          backdrop-blur-md px-8 py-10 flex flex-col justify-center
          space-y-4 border border-[#4A7FA7] border-opacity-30 shadow-2xl">

          <h2 className="font-heading text-2xl font-semibold text-white
            text-center tracking-widest">
            REGISTER
          </h2>

          {error && (
            <ErrorMessage message={error} onDismiss={() => setError("")} />
          )}

          {/* Google Button */}
          <button
            onClick={() => handleGoogleRegister()}
            disabled={gLoading}
            className="w-full flex items-center justify-center gap-3
              bg-white text-gray-700 font-body text-sm font-medium
              py-3 rounded-lg hover:bg-gray-100 transition-colors
              duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gLoading ? (
              <LoadingSpinner size="sm" color="primary" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-body text-xs text-white/40">
              or register with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-3">
            <input type="text" name="firstName" placeholder="First Name"
              value={formData.firstName} onChange={handleChange}
              className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7] transition-colors" />

            <input type="text" name="lastName" placeholder="Last Name"
              value={formData.lastName} onChange={handleChange}
              className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7] transition-colors" />

            <input type="email" name="email" placeholder="Email"
              value={formData.email} onChange={handleChange}
              className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                rounded-lg border border-[#4A7FA7] border-opacity-40
                focus:outline-none focus:border-[#4A7FA7] transition-colors" />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm pl-4 pr-10 py-3
                  rounded-lg border border-[#4A7FA7] border-opacity-40
                  focus:outline-none focus:border-[#4A7FA7] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3CFE5] hover:text-white focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm pl-4 pr-10 py-3
                  rounded-lg border border-[#4A7FA7] border-opacity-40
                  focus:outline-none focus:border-[#4A7FA7] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3CFE5] hover:text-white focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="space-y-2">
              <p className="font-body text-sm text-[#B3CFE5]">
                Choose your role
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRoleSelect("student")}
                  className={`flex flex-col items-center gap-2 py-4
                    rounded-lg border transition-all duration-200
                    ${formData.role === "student"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5]"}`}
                >
                  <GraduationCap size={28} />
                  <span className="font-body text-sm font-medium">Student</span>
                </button>
                <button
                  onClick={() => handleRoleSelect("mentor")}
                  className={`flex flex-col items-center gap-2 py-4
                    rounded-lg border transition-all duration-200
                    ${formData.role === "mentor"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5]"}`}
                >
                  <Users size={28} />
                  <span className="font-body text-sm font-medium">Mentor</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                font-body text-sm font-medium py-3 rounded-lg
                transition-colors duration-200 flex items-center
                justify-center gap-2 disabled:opacity-50
                disabled:cursor-not-allowed"
            >
              {loading
                ? <LoadingSpinner size="sm" color="white" />
                : "Register"
              }
            </button>
          </div>

          <p className="font-body text-xs text-[#B3CFE5] text-center">
            Already have an account?{" "}
            <Link to="/login"
              className="text-[#4A7FA7] font-bold hover:text-white
                transition-colors">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default RegisterPage