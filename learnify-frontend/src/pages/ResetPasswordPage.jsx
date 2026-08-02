import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Lock, Check, X, Eye, EyeOff }           from "lucide-react"
import backgroundImage from "../assets/images/background.jpg"
import api             from "../api/axiosInstance"

function validatePassword(password) {
  return (
    password.length >= 8       &&
    /[A-Z]/.test(password)     &&
    /[a-z]/.test(password)     &&
    /[0-9]/.test(password)     &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function PasswordCriteria({ password }) {
  if (!password) return null

  const criteria = [
    { label: "At least 8 characters",          met: password.length >= 8          },
    { label: "At least one uppercase (A–Z)",    met: /[A-Z]/.test(password)        },
    { label: "At least one lowercase (a–z)",    met: /[a-z]/.test(password)        },
    { label: "At least one number (0–9)",       met: /[0-9]/.test(password)        },
    { label: "At least one special character",  met: /[^A-Za-z0-9]/.test(password) },
  ]

  return (
    <div className="bg-white/5 rounded-lg px-3 py-2.5 space-y-1.5 mt-2">
      {criteria.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full flex items-center
            justify-center flex-shrink-0 transition-colors duration-200
            ${c.met ? "bg-green-500" : "bg-white/10 border border-white/20"}`}>
            {c.met
              ? <Check size={9} className="text-white" strokeWidth={3} />
              : <X     size={9} className="text-white/30" strokeWidth={3} />
            }
          </div>
          <span className={`font-body text-[10px] transition-colors
            ${c.met ? "text-green-400" : "text-white/40"}`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function ResetPasswordPage() {
  const navigate                        = useNavigate()
  const [searchParams]                  = useSearchParams()
  const token                           = searchParams.get("token")

  const [password, setPassword]         = useState("")
  const [confirmPassword, setConfirm]   = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState("")

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password")
    }
  }, [token])

  async function handleReset(e) {
    e.preventDefault()
    setError("")

    if (!validatePassword(password)) {
      setError("Password does not meet all requirements")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      await api.post("/auth/reset-password", { token, password })
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000)
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        "This reset link is invalid or has expired."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center
      justify-center">

      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[#0A1931] opacity-60" />

      <div className="relative z-10 w-full max-w-md mx-6 bg-[#0A1931]
        bg-opacity-95 backdrop-blur-md rounded-2xl px-8 py-10
        border border-[#4A7FA7] border-opacity-30 shadow-2xl">

        {success ? (
          /* ── Success State ── */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20
              flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white">
              Password Reset!
            </h2>
            <p className="font-body text-sm text-[#B3CFE5]">
              Your password has been reset successfully.
              Redirecting to login...
            </p>
            <Link to="/login"
              className="inline-block font-body text-sm text-[#4A7FA7]
                hover:text-white transition-colors">
              Go to Login →
            </Link>
          </div>
        ) : (
          /* ── Form State ── */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#4A7FA7]/20
                flex items-center justify-center mx-auto mb-4">
                <Lock size={24} className="text-[#4A7FA7]" />
              </div>
              <h2 className="font-heading text-2xl font-semibold
                text-white tracking-widest">
                RESET PASSWORD
              </h2>
              <p className="font-body text-sm text-[#B3CFE5]">
                Enter your new password below
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40
                rounded-lg px-4 py-3">
                <p className="font-body text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* New Password */}
              <div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2
                    -translate-y-1/2 text-[#B3CFE5]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 bg-[#1A3D63]
                      bg-opacity-60 text-white placeholder-[#B3CFE5]/50
                      font-body text-sm rounded-lg border
                      border-[#4A7FA7] border-opacity-40 focus:outline-none
                      focus:border-[#4A7FA7] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3CFE5]/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && <PasswordCriteria password={password} />}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2
                    -translate-y-1/2 text-[#B3CFE5]/50" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full pl-9 pr-10 py-3 bg-[#1A3D63]
                      bg-opacity-60 text-white placeholder-[#B3CFE5]/50
                      font-body text-sm rounded-lg border
                      focus:outline-none transition-colors
                      ${confirmPassword && password === confirmPassword
                        ? "border-green-400"
                        : confirmPassword && password !== confirmPassword
                        ? "border-red-400"
                        : "border-[#4A7FA7] border-opacity-40 focus:border-[#4A7FA7]"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3CFE5]/50 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="font-body text-xs text-green-400 mt-1 ml-1">
                    ✓ Passwords match
                  </p>
                )}
                {confirmPassword && password !== confirmPassword && (
                  <p className="font-body text-xs text-red-400 mt-1 ml-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                onClick={handleReset}
                disabled={loading || !validatePassword(password)
                  || password !== confirmPassword}
                className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                  font-body text-sm font-medium py-3 rounded-lg
                  transition-colors duration-200 disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>

            <p className="font-body text-xs text-[#B3CFE5] text-center">
              <Link to="/login"
                className="text-[#4A7FA7] font-bold hover:text-white
                  transition-colors">
                ← Back to Login
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default ResetPasswordPage