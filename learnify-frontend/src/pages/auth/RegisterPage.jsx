import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import backgroundImage from "../../assets/images/background.jpg"
import { GraduationCap, Users, Check, X,Eye, EyeOff, Clock, Info, ArrowRight, Upload, FileText } from "lucide-react"
import { registerUser, googleAuth, uploadCV } from "../../api/authApi"
import { useAuth } from "../../hooks/useAuth"
import { useGoogleLogin } from "@react-oauth/google"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import api from "../../api/axiosInstance"

// ── Password Criteria Checker ──────────────────────────────
function PasswordCriteria({ password }) {
  if (!password) return null

  const criteria = [
    { label: "At least 8 characters",                    met: password.length >= 8          },
    { label: "At least one uppercase letter (A–Z)",      met: /[A-Z]/.test(password)        },
    { label: "At least one lowercase letter (a–z)",      met: /[a-z]/.test(password)        },
    { label: "At least one number (0–9)",                met: /[0-9]/.test(password)        },
    { label: "At least one special character (@, #, $)", met: /[^A-Za-z0-9]/.test(password) },
  ]

  const passedCount      = criteria.filter(c => c.met).length
  const strengthLabel    = passedCount <= 1 ? "Very Weak" : passedCount === 2 ? "Weak" : passedCount === 3 ? "Fair" : passedCount === 4 ? "Good" : "Strong"
  const strengthColor    = passedCount <= 1 ? "bg-red-500" : passedCount === 2 ? "bg-orange-500" : passedCount === 3 ? "bg-yellow-400" : passedCount === 4 ? "bg-blue-400" : "bg-green-500"
  const strengthWidth    = passedCount <= 1 ? "w-1/5" : passedCount === 2 ? "w-2/5" : passedCount === 3 ? "w-3/5" : passedCount === 4 ? "w-4/5" : "w-full"
  const strengthTextColor = passedCount <= 1 ? "text-red-400" : passedCount === 2 ? "text-orange-400" : passedCount === 3 ? "text-yellow-400" : passedCount === 4 ? "text-blue-400" : "text-green-400"

  return (
    <div className="mt-2 space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-body text-[10px] text-white/40">Password strength</span>
          <span className={`font-body text-[10px] font-semibold ${strengthTextColor}`}>{strengthLabel}</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${strengthWidth}`} />
        </div>
      </div>
      <div className="bg-white/5 rounded-lg px-3 py-2.5 space-y-1.5">
        {criteria.map((criterion, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${criterion.met ? "bg-green-500" : "bg-white/10 border border-white/20"}`}>
              {criterion.met
                ? <Check size={9} className="text-white" strokeWidth={3} />
                : <X     size={9} className="text-white/30" strokeWidth={3} />
              }
            </div>
            <span className={`font-body text-[10px] transition-colors duration-200 ${criterion.met ? "text-green-400" : "text-white/40"}`}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Validators ─────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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
    qualifications: "", certifications: "",
  })
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState("")

  // ── Password visibility toggles ────────────────────────
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirmPassword, setShowConfirm] = useState(false)

  // ── Google role selection state ────────────────────────
  // Mentor registration notice modal & CV upload state
  const [showMentorNoticeModal, setShowMentorNoticeModal] = useState(false)
  const [noticePendingAction, setNoticePendingAction]     = useState("normal") // "normal" or "google"
  const [cvFile, setCvFile]                               = useState(null)

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

    if (errors[name]) setErrors({ ...errors, [name]: "" })

    if (name === "email" && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
    } else if (name === "email" && validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: "" }))
    }

    if (name === "confirmPassword") {
      if (value && value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }))
      }
    }

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

  function validate() {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim())  newErrors.lastName  = "Last name is required"

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

    if (!formData.role) {
      newErrors.role = "Please select a role"
    } else if (formData.role === "mentor") {
      if (!formData.qualifications.trim())
        newErrors.qualifications = "Qualifications are required for mentors"
      if (!formData.certifications.trim())
        newErrors.certifications = "Certifications are required for mentors"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Execute Normal Register ────────────────────────────
  async function executeRegister() {
    try {
      setLoading(true)
      setApiError("")
      
      let uploadedCvUrl = null
      if (formData.role === "mentor" && cvFile) {
        try {
          const cvRes = await uploadCV(cvFile)
          uploadedCvUrl = cvRes?.data?.cv_url || null
        } catch (cvErr) {
          console.error("CV Upload error:", cvErr)
        }
      }

      const fullName = `${formData.firstName} ${formData.lastName}`
      const response = await registerUser(
        fullName,
        formData.email,
        formData.password,
        formData.role,
        formData.qualifications,
        formData.certifications,
        uploadedCvUrl
      )

      const payload = response?.data || response
      const user = payload?.user
      const access_token = payload?.access_token
      const refresh_token = payload?.refresh_token

      if (user && access_token) {
        setShowMentorNoticeModal(false)
        login(user, access_token, refresh_token)

        // Direct mentor applicants to student dashboard /dashboard initially while application is pending
        const targetRoute = (user?.role === "mentor" || formData.role === "mentor")
          ? "/dashboard"
          : user?.role === "admin"
          ? "/admin/dashboard"
          : "/dashboard"

        navigate(targetRoute, { replace: true })
      } else {
        setApiError("Registration response was invalid. Please try again.")
      }
    } catch (err) {
      console.error("Registration submit error:", err)
      setApiError(
        err.response?.data?.error?.message || err.response?.data?.message || err.message || "Registration failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Form Submit Handler ────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setApiError("")

    if (!validate()) return

    // Open mentor notice popup when registering as mentor
    if (formData.role === "mentor") {
      setNoticePendingAction("normal")
      setShowMentorNoticeModal(true)
      return
    }

    await executeRegister()
  }

  // ── Google Register ────────────────────────────────────
  const handleGoogleRegister = useGoogleLogin({
    flow: "implicit",
    ux_mode: "popup",
    prompt: "select_account",
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        setGLoading(true)
        setApiError("")
        const response = await googleAuth(tokenResponse.access_token, "register")
        const { user, access_token, refresh_token, is_new_user } = response.data

        if (is_new_user) {
          const nameParts = (user.name || "").split(" ")
          setGoogleFirstName(nameParts[0] || "")
          setGoogleLastName(nameParts.slice(1).join(" ") || "")
          setGoogleUserData({ user, access_token, refresh_token })
          setShowRoleSelect(true)
        } else {
          login(user, access_token, refresh_token)
          const target = user?.role === "mentor"
            ? "/mentor/dashboard"
            : user?.role === "admin"
            ? "/admin/dashboard"
            : "/dashboard"
          navigate(target, { replace: true })
        }
      } catch (err) {
        setApiError(err.response?.data?.error?.message || "Google signup failed. Please try again.")
      } finally {
        setGLoading(false)
      }
    },
    onError: (error) => setApiError(
      error?.error === "popup_closed_by_user"
        ? "Google sign-in was cancelled."
        : "Google signup failed. Make sure popups are not blocked and try again."
    )
  })

  // ── Execute Google Role Confirmation ────────────────────
  async function executeGoogleRoleConfirm() {
    try {
      setRoleLoading(true)
      setShowMentorNoticeModal(false)
      setApiError("")
      localStorage.setItem("access_token", googleUserData.access_token)
      const fullName = `${googleFirstName} ${googleLastName}`.trim()
      await api.patch("/users/profile", { name: fullName, role: selectedRole })
      const updatedUser = { ...googleUserData.user, name: fullName, role: selectedRole }
      login(updatedUser, googleUserData.access_token, googleUserData.refresh_token)

      const targetRoute = selectedRole === "mentor"
        ? "/dashboard"
        : selectedRole === "admin"
        ? "/admin/dashboard"
        : "/dashboard"

      navigate(targetRoute, { replace: true })
    } catch (err) {
      setApiError("Failed to save profile. Please try again.")
    } finally {
      setRoleLoading(false)
    }
  }

  // ── Confirm Role After Google Auth ─────────────────────
  async function handleRoleConfirm() {
    if (!selectedRole) { setApiError("Please select a role to continue"); return }
    if (!googleFirstName.trim()) { setApiError("Please enter your first name"); return }

    if (selectedRole === "mentor") {
      setNoticePendingAction("google")
      setShowMentorNoticeModal(true)
      return
    }

    await executeGoogleRoleConfirm()
  }

  // ── Modal Proceed Handler ─────────────────────────────
  function handleModalProceed() {
    if (noticePendingAction === "google") {
      executeGoogleRoleConfirm()
    } else {
      executeRegister()
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
            <h2 className="font-heading text-xl font-bold text-white">Welcome!</h2>
            <p className="font-body text-sm text-[#B3CFE5]">Complete your profile to continue</p>
          </div>

          {apiError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-3">
              <p className="font-body text-xs text-red-300">{apiError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-[#B3CFE5] mb-1 block">First Name</label>
              <input type="text" value={googleFirstName}
                onChange={(e) => setGoogleFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full bg-[#1A3D63] bg-opacity-60 text-white
                  placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                  rounded-lg border border-[#4A7FA7] border-opacity-40
                  focus:outline-none focus:border-[#4A7FA7] transition-colors" />
            </div>
            <div>
              <label className="font-body text-xs text-[#B3CFE5] mb-1 block">Last Name</label>
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
            <p className="font-body text-sm text-[#B3CFE5] text-center">I am a...</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSelectedRole("student")}
                className={`flex flex-col items-center gap-3 py-6 rounded-xl border-2 transition-all duration-200
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
                className={`flex flex-col items-center gap-3 py-6 rounded-xl border-2 transition-all duration-200
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
            {roleLoading ? <LoadingSpinner size="sm" color="white" /> : "Continue to Learnify"}
          </button>
        </div>
      </div>
    )
  }

  // ── Main Register Form ─────────────────────────────────
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
          <h1 className="font-heading text-5xl font-bold text-white">Learnify</h1>
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

          {apiError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-3">
              <p className="font-body text-xs text-red-300">{apiError}</p>
            </div>
          )}

          {/* Google Button */}
          <button onClick={handleGoogleRegister}
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
            <span className="font-body text-xs text-white/40">or register with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-3">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input type="text" name="firstName" placeholder="First Name"
                  value={formData.firstName} onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.firstName ? "border-red-400" : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {errors.firstName && (
                  <p className="font-body text-[10px] text-red-400 mt-0.5 ml-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <input type="text" name="lastName" placeholder="Last Name"
                  value={formData.lastName} onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.lastName ? "border-red-400" : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {errors.lastName && (
                  <p className="font-body text-[10px] text-red-400 mt-0.5 ml-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <input type="email" name="email" placeholder="Email address"
                  value={formData.email} onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3 pr-11
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.email
                      ? "border-red-400"
                      : formData.email && validateEmail(formData.email)
                      ? "border-green-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`} />
                {formData.email && validateEmail(formData.email) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2
                    w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3 pr-11
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.password
                      ? "border-red-400"
                      : formData.password && validatePassword(formData.password)
                      ? "border-green-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-[#B3CFE5]/50 hover:text-[#B3CFE5] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.password && <PasswordCriteria password={formData.password} />}
              {errors.password && !formData.password && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                    placeholder-[#B3CFE5] font-body text-sm px-4 py-3 pr-20
                    rounded-lg border transition-colors focus:outline-none
                    ${errors.confirmPassword
                      ? "border-red-400"
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-400"
                      : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`}
                />
                {/* Match tick */}
                {formData.confirmPassword &&
                 formData.password === formData.confirmPassword && (
                  <div className="absolute right-9 top-1/2 -translate-y-1/2
                    w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-[#B3CFE5]/50 hover:text-[#B3CFE5] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="font-body text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="font-body text-xs text-green-400 mt-1 ml-1">✓ Passwords match</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <p className={`font-body text-sm ${errors.role ? "text-red-400" : "text-[#B3CFE5]"}`}>
                Choose your role *
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleRoleSelect("student")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-lg border transition-all duration-200
                    ${formData.role === "student"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : `bg-[#1A3D63] bg-opacity-60 text-[#B3CFE5] ${errors.role ? "border-red-400" : "border-[#4A7FA7] border-opacity-40"}`}`}>
                  <GraduationCap size={28} />
                  <span className="font-body text-sm font-medium">Student</span>
                </button>
                <button onClick={() => handleRoleSelect("mentor")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-lg border transition-all duration-200
                    ${formData.role === "mentor"
                      ? "bg-[#4A7FA7] border-[#4A7FA7] text-white"
                      : `bg-[#1A3D63] bg-opacity-60 text-[#B3CFE5] ${errors.role ? "border-red-400" : "border-[#4A7FA7] border-opacity-40"}`}`}>
                  <Users size={28} />
                  <span className="font-body text-sm font-medium">Mentor</span>
                </button>
              </div>
              {errors.role && (
                <p className="font-body text-xs text-red-400 ml-1">{errors.role}</p>
              )}
            </div>

            {/* Mentor Extra Fields */}
            {formData.role === "mentor" && (
              <div className="space-y-4 pt-2">
                <div>
                  <textarea
                    name="qualifications"
                    placeholder="Academic Qualifications (e.g. Degree, University, GPA) *"
                    value={formData.qualifications}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                      placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                      rounded-lg border transition-colors focus:outline-none resize-none
                      ${errors.qualifications
                        ? "border-red-400"
                        : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`}
                  />
                  {errors.qualifications && (
                    <p className="font-body text-xs text-red-400 mt-1 ml-1">{errors.qualifications}</p>
                  )}
                </div>
                <div>
                  <textarea
                    name="certifications"
                    placeholder="Certifications & Experience (e.g. teaching, certifications) *"
                    value={formData.certifications}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full bg-[#1A3D63] bg-opacity-60 text-white
                      placeholder-[#B3CFE5] font-body text-sm px-4 py-3
                      rounded-lg border transition-colors focus:outline-none resize-none
                      ${errors.certifications
                        ? "border-red-400"
                        : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`}
                  />
                  {errors.certifications && (
                    <p className="font-body text-xs text-red-400 mt-1 ml-1">{errors.certifications}</p>
                  )}
                </div>

                {/* CV / Resume Upload */}
                <div className="space-y-1">
                  <label className="font-body text-xs text-[#B3CFE5] block">
                    Upload CV / Resume (Optional - PDF, DOCX, PNG, JPG)
                  </label>
                  <div className="relative border border-dashed border-[#4A7FA7]/60 hover:border-[#4A7FA7] rounded-lg p-3 bg-[#1A3D63]/40 transition-colors text-center cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => setCvFile(e.target.files[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center justify-center gap-2 text-[#B3CFE5]">
                      {cvFile ? (
                        <>
                          <FileText size={18} className="text-emerald-400" />
                          <span className="font-body text-xs font-semibold text-white truncate max-w-[220px]">
                            {cvFile.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} className="text-[#4A7FA7]" />
                          <span className="font-body text-xs">Choose CV File</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit}
              disabled={loading || gLoading}
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                font-body text-sm font-medium py-3 rounded-lg
                transition-colors duration-200 flex items-center
                justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <LoadingSpinner size="sm" color="white" /> : "Create Account"}
            </button>

          </div>

          <p className="font-body text-xs text-[#B3CFE5] text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#4A7FA7] font-bold hover:text-white transition-colors">
              Sign In
            </Link>
          </p>

        </div>
      </div>

      {/* ── Mentor Notice Modal ─────────────────────────────── */}
      {showMentorNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0A1931] border border-[#4A7FA7] border-opacity-40 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 text-white">
            
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#4A7FA7]/20 border border-[#4A7FA7]/40 flex items-center justify-center text-[#4A7FA7] flex-shrink-0">
                <Info size={28} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">
                  Mentor Access Notice
                </h3>
                <p className="font-body text-xs text-[#B3CFE5] mt-1">
                  Please review the access policy below before completing your registration.
                </p>
              </div>
            </div>

            {/* Modal Body Message */}
            <div className="space-y-3 bg-[#1A3D63]/50 border border-[#4A7FA7]/30 rounded-xl p-4 text-sm font-body leading-relaxed text-[#B3CFE5]">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold text-xs uppercase tracking-wider">
                <Clock size={16} />
                <span>Pending Admin Approval</span>
              </div>
              <p>
                When registering as a mentor, you will initially receive <strong className="text-white font-semibold">Student access</strong> to explore the platform.
              </p>
              <p>
                Your submitted credentials (qualifications and certifications) will be reviewed by an administrator. Once approved by an admin, your account access will be upgraded to <strong className="text-white font-semibold">Mentor access</strong>.
              </p>
            </div>

            {/* Modal API Error */}
            {apiError && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 font-body">
                {apiError}
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMentorNoticeModal(false)}
                disabled={loading || roleLoading}
                className="w-1/3 px-4 py-3 rounded-lg border border-white/20 hover:bg-white/10 text-white font-body text-sm font-medium transition-colors text-center disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleModalProceed}
                disabled={loading || roleLoading}
                className="w-2/3 px-4 py-3 rounded-lg bg-[#4A7FA7] hover:bg-[#1A3D63] text-white font-body text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {(loading || roleLoading) ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <span>Click to Proceed</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterPage