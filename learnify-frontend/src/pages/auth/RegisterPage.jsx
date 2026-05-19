import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import AuthLayout from "../../components/layout/AuthLayout"

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, error: authError } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }))
  }

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await register(
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.password,
        formData.confirmPassword,
        formData.role
      )
      navigate("/dashboard")
    } catch (err) {
      setErrors({ submit: authError || "Registration failed. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout type="register">
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-[0.35em] uppercase text-slate-100">REGISTER</h2>
          <p className="text-sm text-slate-400">Create your Learnify account to access the platform.</p>
        </div>

        {(errors.submit || authError) && (
          <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {errors.submit || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
                errors.firstName ? "border-rose-500" : "border-slate-700 bg-slate-100"
              }`}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
                errors.lastName ? "border-rose-500" : "border-slate-700 bg-slate-100"
              }`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {errors.firstName && <p className="text-sm text-rose-300">{errors.firstName}</p>}
            {errors.lastName && <p className="text-sm text-rose-300">{errors.lastName}</p>}
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
              errors.email ? "border-rose-500" : "border-slate-700 bg-slate-100"
            }`}
          />
          {errors.email && <p className="text-sm text-rose-300">{errors.email}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
              errors.password ? "border-rose-500" : "border-slate-700 bg-slate-100"
            }`}
          />
          {errors.password && <p className="text-sm text-rose-300">{errors.password}</p>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full rounded-3xl border px-4 py-3 text-slate-900 outline-none transition duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/50 ${
              errors.confirmPassword ? "border-rose-500" : "border-slate-700 bg-slate-100"
            }`}
          />
          {errors.confirmPassword && <p className="text-sm text-rose-300">{errors.confirmPassword}</p>}

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Choose your role</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleChange("student")}
                className={`flex h-32 flex-col items-center justify-center gap-3 rounded-3xl border px-4 text-sm font-semibold transition duration-200 ${
                  formData.role === "student"
                    ? "border-sky-300 bg-slate-100 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-2xl text-slate-900">🎓</div>
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("mentor")}
                className={`flex h-32 flex-col items-center justify-center gap-3 rounded-3xl border px-4 text-sm font-semibold transition duration-200 ${
                  formData.role === "mentor"
                    ? "border-sky-300 bg-slate-100 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-2xl text-slate-900">🧑‍🏫</div>
                Mentor
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-3xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-sky-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage