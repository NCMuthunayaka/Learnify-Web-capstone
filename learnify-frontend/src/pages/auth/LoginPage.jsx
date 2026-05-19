import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import AuthLayout from "../../components/layout/AuthLayout"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, error: authError } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err) {
      setErrors({ submit: authError || "Login failed. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout type="login">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-[0.35em] uppercase text-slate-100">LOGIN</h2>
          <p className="text-sm text-slate-400">Login to continue your learning journey.</p>
        </div>

        {(errors.submit || authError) && (
          <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {errors.submit || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors({ ...errors, email: "" })
            }}
            className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
              errors.email ? "border-rose-500" : "border-slate-700 bg-slate-100"
            }`}
          />
          {errors.email && <p className="text-sm text-rose-300">{errors.email}</p>}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors({ ...errors, password: "" })
            }}
            className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
              errors.password ? "border-rose-500" : "border-slate-700 bg-slate-100"
            }`}
          />
          {errors.password && <p className="text-sm text-rose-300">{errors.password}</p>}

          <div className="flex justify-between items-center text-sm text-slate-300">
            <div />
            <button type="button" className="text-sky-200 hover:text-white transition">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-3xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-sky-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}

export default LoginPage