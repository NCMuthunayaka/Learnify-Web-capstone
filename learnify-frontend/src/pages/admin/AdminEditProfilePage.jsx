import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Camera, Save, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle,
} from "lucide-react"
import api from "../../api/axiosInstance"
import Toast from "../../components/common/Toast"

const STORAGE_KEY    = "admin_profile_image"
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "A"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function AdminEditProfilePage() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [form,         setForm]         = useState({ name: "", email: "", phone: "" })
  const [errors,       setErrors]       = useState({})
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(STORAGE_KEY) || null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile,    setImageFile]    = useState(null)
  const [imageError,   setImageError]   = useState("")
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [toasts,       setToasts]       = useState([])

  function pushToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }

  useEffect(() => {
    async function load() {
      try {
        const res  = await api.get("/auth/me")
        const data = res.data?.data || res.data
        setForm({ name: data.name || "", email: data.email || "", phone: data.phone || "" })
      } catch {
        try {
          const token = localStorage.getItem("access_token")
          if (token) {
            const p = JSON.parse(atob(token.split(".")[1]))
            setForm({ name: p.name || "", email: p.email || "", phone: p.phone || "" })
          }
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleImageChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) { setImageError("Only JPG, PNG, or WEBP are allowed."); return }
    if (f.size > MAX_SIZE_BYTES)          { setImageError("File exceeds 5 MB limit.");            return }
    setImageError("")
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())
      errs.name = "Full name is required."
    if (!form.email.trim())
      errs.email = "Email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address."
    if (form.phone && !/^\+?[\d\s\-(). ]{7,20}$/.test(form.phone))
      errs.phone = "Enter a valid phone number."
    return errs
  }

  async function handleSave() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      if (imageFile && imagePreview) {
        try {
          const fd = new FormData()
          fd.append("image", imageFile)
          await api.post("/users/profile/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        } catch {
          pushToast("Photo upload failed — profile details will still be saved.", "error")
        }
        localStorage.setItem(STORAGE_KEY, imagePreview)
        setProfileImage(imagePreview)
      }

      await api.put("/auth/me", { name: form.name, phone: form.phone })

      pushToast("Profile updated successfully!", "success")
      setTimeout(() => navigate("/admin/profile"), 1600)
    } catch {
      pushToast("Failed to save changes. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  const displayImage = imagePreview || profileImage
  const initials     = getInitials(form.name || "Admin")

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4A7FA7] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div className="max-w-2xl mx-auto p-6 space-y-6">

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
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-heading font-bold text-lg text-[#0A1931]">Edit Profile</h2>
            <p className="font-body text-sm text-gray-400 mt-0.5">Update your account information</p>
          </div>

          <div className="p-6 space-y-6">

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md">
                  {displayImage ? (
                    <img src={displayImage} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63]
                      flex items-center justify-center">
                      <span className="font-heading font-bold text-white text-2xl">{initials}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center
                  justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={18} className="text-white" />
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-body text-xs text-[#4A7FA7] hover:text-[#1A3D63] font-semibold transition-colors"
              >
                Change Photo
              </button>

              {imagePreview && !imageError && (
                <span className="inline-flex items-center gap-1 font-body text-[11px]
                  text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={10} /> New photo ready to save
                </span>
              )}
              {imageError && (
                <span className="inline-flex items-center gap-1 font-body text-[11px] text-red-500">
                  <AlertCircle size={10} /> {imageError}
                </span>
              )}
            </div>

            {/* Form fields */}
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="font-body text-xs font-semibold text-[#0A1931] uppercase tracking-wider mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: "" })) }}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 rounded-xl border font-body text-sm text-[#0A1931]
                    placeholder-gray-300 outline-none transition-colors
                    ${errors.name
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-gray-200 focus:border-[#4A7FA7] bg-white"}`}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 font-body text-[11px] text-red-500 mt-1">
                    <AlertCircle size={10} />{errors.name}
                  </p>
                )}
              </div>

              {/* Email — read-only (account identifier) */}
              <div>
                <label className="font-body text-xs font-semibold text-[#0A1931] uppercase tracking-wider mb-1.5 block">
                  Email Address
                  <span className="ml-1 text-gray-400 normal-case font-normal">(read-only)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                    font-body text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="font-body text-xs font-semibold text-[#0A1931] uppercase tracking-wider mb-1.5 block">
                  Phone Number
                  <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: "" })) }}
                  placeholder="+60 12-345 6789"
                  className={`w-full px-4 py-3 rounded-xl border font-body text-sm text-[#0A1931]
                    placeholder-gray-300 outline-none transition-colors
                    ${errors.phone
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-gray-200 focus:border-[#4A7FA7] bg-white"}`}
                />
                {errors.phone && (
                  <p className="flex items-center gap-1 font-body text-[11px] text-red-500 mt-1">
                    <AlertCircle size={10} />{errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
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
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#0A1931] text-white font-body text-sm
                  font-semibold hover:bg-[#1A3D63] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={15} className="animate-spin" />Saving…</>
                ) : (
                  <><Save size={15} />Save Changes</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
