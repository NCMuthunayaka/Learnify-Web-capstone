import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import backgroundImage from "../../assets/images/background.jpg"
import { GraduationCap, Users, Check, X } from "lucide-react"
import { registerUser, googleAuth } from "../../api/authApi"
import { useAuth } from "../../hooks/useAuth"
import { useGoogleLogin } from "@react-oauth/google"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import api from "../../api/axiosInstance"

// ── Password Criteria Checker ──────────────────────────────
function PasswordCriteria({ password }) {
  if (!password) return null

  const criteria = [
    {
      label: "At least 8 characters",
      met:   password.length >= 8,
    },
    {
      label: "At least one uppercase letter (A–Z)",
      met:   /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter (a–z)",
      met:   /[a-z]/.test(password),
    },
    {
      label: "At least one number (0–9)",
      met:   /[0-9]/.test(password),
    },
    {
      label: "At least one special character (@, #, $, etc.)",
      met:   /[^A-Za-z0-9]/.test(password),
    },
  ]

  const passedCount = criteria.filter(c => c.met).length
  const allPassed   = passedCount === criteria.length

  // Strength label
  const strengthLabel =
    passedCount <= 1 ? "Very Weak"  :
    passedCount === 2 ? "Weak"      :
    passedCount === 3 ? "Fair"      :
    passedCount === 4 ? "Good"      : "Strong"

  const strengthColor =
    passedCount <= 1 ? "bg-red-500"    :
    passedCount === 2 ? "bg-orange-500" :
    passedCount === 3 ? "bg-yellow-400" :
    passedCount === 4 ? "bg-blue-400"   : "bg-green-500"

  const strengthWidth =
    passedCount <= 1 ? "w-1/5"  :
    passedCount === 2 ? "w-2/5" :
    passedCount === 3 ? "w-3/5" :
    passedCount === 4 ? "w-4/5" : "w-full"

  const strengthTextColor =
    passedCount <= 1 ? "text-red-400"    :
    passedCount === 2 ? "text-orange-400" :
    passedCount === 3 ? "text-yellow-400" :
    passedCount === 4 ? "text-blue-400"   : "text-green-400"

  return (
    <div className="mt-2 space-y-2">

      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-body text-[10px] text-white/40">
            Password strength
          </span>
          <span className={`font-body text-[10px] font-semibold ${strengthTextColor}`}>
            {strengthLabel}
          </span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300
            ${strengthColor} ${strengthWidth}`} />
        </div>
      </div>

      {/* Criteria List — shows live as user types */}
      <div className="bg-white/5 rounded-lg px-3 py-2.5 space-y-1.5">
        {criteria.map((criterion, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center
              justify-center flex-shrink-0 transition-colors duration-200
              ${criterion.met
                ? "bg-green-500"
                : "bg-white/10 border border-white/20"}`}>
              {criterion.met
                ? <Check size={9} className="text-white" strokeWidth={3} />
                : <X size={9} className="text-white/30" strokeWidth={3} />
              }
            </div>
            <span className={`font-body text-[10px] transition-colors
              duration-200
              ${criterion.met ? "text-green-400" : "text-white/40"}`}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}

// ── Email Validator ────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Password Validator ─────────────────────────────────────
function validatePassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function RegisterPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "", role: "",
  })
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState("")

  // Google role selection state
  const [showRoleSelect, setShowRoleSelect]   = useState(false)
  const [googleUserData, setGoogleUserData]   = useState(null)
  const [selectedRole, setSelectedRole]       = useState("")
  const [googleFirstName, setGoogleFirstName] = useState("")
  const [googleLastName, setGoogleLastName]   = useState("")
  const [roleLoading, setRoleLoading]         = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear field error as user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }

    // Real-time email validation while typing
    if (name === "email" && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
    } else if (name === "email" && validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: "" }))
    }

    // Real-time confirm password check
    if (name === "confirmPassword") {
      if (value && value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }))
      }
    }

    // If password changes, re-check confirm password
    if (name === "password" && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }))
      }
    }
  }

  function handleRoleSelect(role) {
    setFormData({ ...formData, role })
    if (errors.role) setErrors({ ...errors, role: "" })
  }

  // ── Full Validation ────────────────────────────────────
  function validate() {
    const newErrors = {}

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required"

    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required"

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password does not meet all requirements"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.role)
      newErrors.role = "Please select a role"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Normal Register ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setApiError("")

    if (!validate()) return

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
      setApiError(
        err.response?.data?.error?.message || "Registration failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Google Register ────────────────────────────────────
  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGLoading(true)
        setApiError("")
        const response = await googleAuth(tokenResponse.access_token)
        const { user, access_token, refresh_token, is_new_user } = response.data

        if (is_new_user) {
          const nameParts = (user.name || "").split(" ")
          setGoogleFirstName(nameParts[0] || "")
          setGoogleLastName(nameParts.slice(1).join(" ") || "")
          setGoogleUserData({ user, access_token, refresh_token })
          setShowRoleSelect(true)
        } else {
          login(user, access_token, refresh_token)
          navigate("/dashboard")
        }
      } catch (err) {
        setApiError(
          err.response?.data?.error?.message || "Google signup failed."
        )
      } finally {
        setGLoading(false)
      }
    },
    onError: () => setApiError("Google signup was cancelled or failed.")
  })

  // ── Confirm Role After Google Auth ─────────────────────
  async function handleRoleConfirm() {
    if (!selectedRole) {
      setApiError("Please select a role to continue")
      return
    }
    if (!googleFirstName.trim()) {
      setApiError("Please enter your first name")
      return
    }

    try {
      setRoleLoading(true)
      setApiError("")
      localStorage.setItem("access_token", googleUserData.access_token)
      const fullName = `${googleFirstName} ${googleLastName}`.trim()
      await api.patch("/users/profile", { name: fullName, role: selectedRole })
      const updatedUser = { ...googleUserData.user, name: fullName, role: selectedRole }
      login(updatedUser, googleUserData.access_token, googleUserData.refresh_token)
      navigate("/dashboard")
    } catch (err) {
      setApiError("Failed to save profile. Please try again.")
    } finally {
      setRoleLoading(false)
    }
  }

  // ── Role Selection Screen ──────────────────────────────
  if (showRoleSelect) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
          style={{ backgroundImage: `url(${backgroundImage})` }} />
        <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

        <div className="relative z-10 w-full max-w-md mx-6 bg-[#0A1931]
          bg-opacity-95 backdrop-blur-md rounded-2xl px-8 py-10
          border border-[#4A7FA7] border-opacity-30 shadow-2xl space-y-6">

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#4A7FA7] flex
              items-center justify-center mx-auto mb-4">
              <span className="font-heading text-2xl font-bold text-white">
                {googleFirstName.charAt(0) || "U"}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-white">
              Welcome!
            </h2>
            <p className="font-body text-sm text-[#B3CFE5]">
              Complete your profile to continue
            </p>
          </div>

          {apiError && (
            <div className="bg-red-500/20 border border-red-500/40
              rounded-lg px-4 py-3">
              <p className="font-body text-xs text-red-300">{apiError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-[#B3CFE5] mb-1 block">
                First Name
              </label>
              <input type="text" value={googleFirstName}
                onChange={(e) => setGoogleFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                  rounded-lg border border-[#4A7FA7] border-opacity-40
                  focus:outline-none focus:border-[#4A7FA7] transition-colors" />
            </div>
            <div>
              <label className="font-body text-xs text-[#B3CFE5] mb-1 block">
                Last Name
              </label>
              <input type="text" value={googleLastName}
                onChange={(e) => setGoogleLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                  rounded-lg border border-[#4A7FA7] border-opacity-40
                  focus:outline-none focus:border-[#4A7FA7] transition-colors" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-body text-sm text-[#B3CFE5] text-center">
              I am a...
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSelectedRole("student")}
                className={`flex flex-col items-center gap-3 py-6
                  rounded-xl border-2 transition-all duration-200
                  ${selectedRole === "student"
                    ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                    : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5]"}`}>
                <GraduationCap size={32} />
                <div className="text-center">
                  <p className="font-body text-sm font-semibold">Student</p>
                  <p className="font-body text-xs opacity-70 mt-0.5">I want to learn</p>
                </div>
              </button>
              <button onClick={() => setSelectedRole("mentor")}
                className={`flex flex-col items-center gap-3 py-6
                  rounded-xl border-2 transition-all duration-200
                  ${selectedRole === "mentor"
                    ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                    : "bg-[#1A3D63] bg-opacity-60 border-[#4A7FA7] border-opacity-40 text-[#B3CFE5]"}`}>
                <Users size={32} />
                <div className="text-center">
                  <p className="font-body text-sm font-semibold">Mentor</p>
                  <p className="font-body text-xs opacity-70 mt-0.5">I want to teach</p>
                </div>
              </button>
            </div>
          </div>

          <button onClick={handleRoleConfirm}
            disabled={roleLoading || !selectedRole}
            className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
              font-body text-sm font-medium py-3 rounded-lg transition-colors
              duration-200 flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed">
            {roleLoading
              ? <LoadingSpinner size="sm" color="white" />
              : "Continue to Learnify"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">

      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

      <div className="relative z-10 w-full max-w-3xl mx-6 flex
        rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">

        {/* Left Panel */}
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
            Create your account to access personalized study schedules,
            AI-powered assistance, and collaborative learning.
          </p>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-96 bg-[#0A1931] bg-opacity-95
          backdrop-blur-md px-8 py-8 flex flex-col justify-center
          space-y-4 border border-[#4A7FA7] border-opacity-30 shadow-2xl
          overflow-y-auto max-h-screen">

          <h2 className="font-heading text-2xl font-semibold text-white
            text-center tracking-widest">
            REGISTER
          </h2>

          {/* API Error */}
          {apiError && (
            <div className="bg-red-500/20 border border-red-500/40
              rounded-lg px-4 py-3">
              <p className="font-body text-xs text-red-300">{apiError}</p>
            </div>
          )}

          {/* Google Button */}
          <button onClick={() => handleGoogleRegister()}
            disabled={loading || gLoading}
            className="w-full flex items-center justify-center gap-3
              bg-white text-gray-700 font-body text-sm font-medium
              py-3 rounded-lg hover:bg-gray-100 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed">
            {gLoading ? <LoadingSpinner size="sm" color="primary" /> : (
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

            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input type="text" name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.firstName
                      ? "border-red-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {errors.firstName && (
                  <p className="font-body text-[10px] text-red-400 mt-0.5 ml-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <input type="text" name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.lastName
                      ? "border-red-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {errors.lastName && (
                  <p className="font-body text-[10px] text-red-400 mt-0.5 ml-1">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email — with real-time format check */}
            <div>
              <div className="relative">
                <input type="email" name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.email
                      ? "border-red-400"
                      : formData.email && validateEmail(formData.email)
                      ? "border-green-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {/* Live email valid indicator */}
                {formData.email && validateEmail(formData.email) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2
                    w-5 h-5 rounded-full bg-green-500 flex items-center
                    justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password — with live criteria checker */}
            <div>
              <input type="password" name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                  rounded-lg border transition-colors focus:outline-none
                  ${errors.password
                    ? "border-red-400"
                    : formData.password && validatePassword(formData.password)
                    ? "border-green-400"
                    : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />

              {/* Live password criteria — shows as user types */}
              {formData.password && (
                <PasswordCriteria password={formData.password} />
              )}

              {errors.password && !formData.password && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input type="password" name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.confirmPassword
                      ? "border-red-400"
                      : formData.confirmPassword &&
                        formData.password === formData.confirmPassword
                      ? "border-green-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {/* Match indicator */}
                {formData.confirmPassword &&
                 formData.password === formData.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2
                    w-5 h-5 rounded-full bg-green-500 flex items-center
                    justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
               formData.password === formData.confirmPassword && (
                <p className="font-body text-xs text-green-400 mt-1 ml-1">
                  ✓ Passwords match
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <p className={`font-body text-sm
                ${errors.role ? "text-red-400" : "text-[#B3CFE5]"}`}>
                Choose your role *
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleRoleSelect("student")}
                  className={`flex flex-col items-center gap-2 py-4
                    rounded-lg border transition-all duration-200
                    ${formData.role === "student"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : `bg-[#1A3D63] bg-opacity-60 text-[#B3CFE5]
                         ${errors.role
                           ? "border-red-400"
                           : "border-[#4A7FA7] border-opacity-40"}`}`}>
                  <GraduationCap size={28} />
                  <span className="font-body text-sm font-medium">Student</span>
                </button>
                <button onClick={() => handleRoleSelect("mentor")}
                  className={`flex flex-col items-center gap-2 py-4
                    rounded-lg border transition-all duration-200
                    ${formData.role === "mentor"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : `bg-[#1A3D63] bg-opacity-60 text-[#B3CFE5]
                         ${errors.role
                           ? "border-red-400"
                           : "border-[#4A7FA7] border-opacity-40"}`}`}>
                  <Users size={28} />
                  <span className="font-body text-sm font-medium">Mentor</span>
                </button>
              </div>
              {errors.role && (
                <p className="font-body text-xs text-red-400 ml-1">
                  {errors.role}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button onClick={handleSubmit}
              disabled={loading || gLoading}
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                font-body text-sm font-medium py-3 rounded-lg
                transition-colors duration-200 flex items-center
                justify-center gap-2 disabled:opacity-50
                disabled:cursor-not-allowed">
              {loading
                ? <LoadingSpinner size="sm" color="white" />
                : "Create Account"
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