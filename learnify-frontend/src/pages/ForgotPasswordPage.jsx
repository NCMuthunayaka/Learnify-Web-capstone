import { useState } from "react"
import { Link }     from "react-router-dom"
import { Mail }     from "lucide-react"
import backgroundImage from "../assets/images/background.jpg"
import api             from "../api/axiosInstance"

function ForgotPasswordPage() {
  const [email, setEmail]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]       = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      await api.post("/auth/forgot-password", { email })
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(
        msg || "This email is not registered with WhisperHive. Please check your email or sign up for an account."
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

        {submitted ? (
          /* ── Success State ── */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20
              flex items-center justify-center mx-auto">
              <Mail size={28} className="text-green-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white">
              Check Your Email
            </h2>
            <p className="font-body text-sm text-[#B3CFE5] leading-relaxed">
              If an account with <strong className="text-white">{email}</strong> exists,
              we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <p className="font-body text-xs text-[#B3CFE5]/60">
              The link expires in 1 hour.
            </p>
            <Link to="/login"
              className="inline-block font-body text-sm text-[#4A7FA7]
                hover:text-white transition-colors mt-2">
              ← Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form State ── */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#4A7FA7]/20
                flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-[#4A7FA7]" />
              </div>
              <h2 className="font-heading text-2xl font-semibold
                text-white tracking-widest">
                FORGOT PASSWORD
              </h2>
              <p className="font-body text-sm text-[#B3CFE5]">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40
                rounded-lg px-4 py-3">
                <p className="font-body text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2
                  -translate-y-1/2 text-[#B3CFE5]/50" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  className="w-full pl-9 pr-3 py-3 bg-[#1A3D63] bg-opacity-60
                    text-white placeholder-[#B3CFE5]/50 font-body text-sm
                    rounded-lg border border-[#4A7FA7] border-opacity-40
                    focus:outline-none focus:border-[#4A7FA7] transition-colors"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white
                  font-body text-sm font-medium py-3 rounded-lg
                  transition-colors duration-200 disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>

            <p className="font-body text-xs text-[#B3CFE5] text-center">
              Remember your password?{" "}
              <Link to="/login"
                className="text-[#4A7FA7] font-bold hover:text-white
                  transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default ForgotPasswordPage