import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react"
import api from "../../api/axiosInstance"
import Toast from "../../components/common/Toast"

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"]
const STRENGTH_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"]
const STRENGTH_TEXT   = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-green-600"]

export default function AdminChangePasswordPage() {
  const navigate = useNavigate()

  const [form,   setForm]   = useState({ current: "", newPass: "", confirm: "" })
  const [show,   setShow]   = useState({ current: false, newPass: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])

  const strength = getStrength(form.newPass)

  function pushToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }

  function validate() {
    const errs = {}
    if (!form.current)
      errs.current = "Current password is required."
    if (!form.newPass)
      errs.newPass = "New password is required."
    else if (form.newPass.length < 8)
      errs.newPass = "Password must be at least 8 characters."
    else if (strength < 2)
      errs.newPass = "Password is too weak — add uppercase, numbers, or symbols."
    if (!form.confirm)
      errs.confirm = "Please confirm your new password."
    else if (form.newPass !== form.confirm)
      errs.confirm = "Passwords do not match."
    if (form.current && form.newPass && form.current === form.newPass)
      errs.newPass = "New password must differ from your current password."
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await api.patch("/users/change-password", {
        current_password: form.current,
        new_password:     form.newPass,
      })
      pushToast("Password changed successfully!", "success")
      setForm({ current: "", newPass: "", confirm: "" })
      setTimeout(() => navigate("/admin/profile"), 2000)
    } catch (err) {
      const msg = err?.response?.data?.message
        || "Failed to change password. Please check your current password."
      pushToast(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  function PasswordField({ fieldKey, label, placeholder }) {
    return (
      <div>
        <label className="font-body text-xs font-semibold text-[#0A1931] uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Lock size={15} />
          </div>
          <input
            type={show[fieldKey] ? "text" : "password"}
            value={form[fieldKey]}
            onChange={e => {
              setForm(p => ({ ...p, [fieldKey]: e.target.value }))
              setErrors(p => ({ ...p, [fieldKey]: "" }))
            }}
            placeholder={placeholder}
            className={`w-full pl-10 pr-12 py-3 rounded-xl border font-body text-sm
              text-[#0A1931] placeholder-gray-300 outline-none transition-colors
              ${errors[fieldKey]
                ? "border-red-300 bg-red-50 focus:border-red-400"
                : "border-gray-200 focus:border-[#4A7FA7] bg-white"}`}
          />
          <button
            type="button"
            onClick={() => setShow(p => ({ ...p, [fieldKey]: !p[fieldKey] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8
              flex items-center justify-center text-gray-400 hover:text-gray-600
              rounded-lg hover:bg-gray-100 transition-colors"
          >
            {show[fieldKey] ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors[fieldKey] && (
          <p className="flex items-center gap-1 font-body text-[11px] text-red-500 mt-1">
            <AlertCircle size={10} />{errors[fieldKey]}
          </p>
        )}
      </div>
    )
  }

  const requirements = [
    ["At least 8 characters",   form.newPass.length >= 8],
    ["One uppercase letter",    /[A-Z]/.test(form.newPass)],
    ["One number",              /[0-9]/.test(form.newPass)],
    ["One special character",   /[^A-Za-z0-9]/.test(form.newPass)],
  ]

  return (
    <>
      <Toast toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div className="max-w-lg mx-auto p-6 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4A7FA7] hover:text-[#1A3D63] transition-colors font-body text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-[#0A1931] flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0A1931]">Change Password</h2>
              <p className="font-body text-xs text-gray-400 mt-0.5">Keep your account secure</p>
            </div>
          </div>

          <div className="p-6 space-y-5">

            <PasswordField fieldKey="current" label="Current Password"  placeholder="Enter your current password" />

            {/* New password + strength */}
            <div className="space-y-2">
              <PasswordField fieldKey="newPass" label="New Password" placeholder="Enter a new password" />
              {form.newPass && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300
                          ${i <= strength ? STRENGTH_COLORS[strength] : "bg-gray-100"}`}
                      />
                    ))}
                  </div>
                  <p className={`font-body text-[11px] font-semibold ${STRENGTH_TEXT[strength]}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            <PasswordField fieldKey="confirm" label="Confirm New Password" placeholder="Repeat your new password" />

            {/* Requirements checklist */}
            <div className="p-4 bg-[#F6FAFD] rounded-xl border border-[#B3CFE5]/30 space-y-2">
              <p className="font-body text-xs font-semibold text-[#0A1931] mb-2.5">
                Password requirements:
              </p>
              {requirements.map(([req, met]) => (
                <div key={req} className="flex items-center gap-2">
                  <CheckCircle2
                    size={13}
                    className={`flex-shrink-0 transition-colors ${met ? "text-green-500" : "text-gray-300"}`}
                  />
                  <span className={`font-body text-xs transition-colors ${met ? "text-green-600" : "text-gray-400"}`}>
                    {req}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate(-1)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-body text-sm
                  font-semibold text-gray-600 hover:bg-gray-50 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#0A1931] text-white font-body text-sm
                  font-semibold hover:bg-[#1A3D63] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={15} className="animate-spin" />Updating…</>
                ) : (
                  <><Shield size={15} />Update Password</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
