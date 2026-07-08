import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User, Mail, Phone, Calendar, Shield,
  Edit3, ArrowLeft, CheckCircle, Lock,
} from "lucide-react"
import api from "../../api/axiosInstance"

const STORAGE_KEY = "admin_profile_image"

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "A"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(str) {
  if (!str) return "Not available"
  try { return new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }
  catch { return str }
}

export default function AdminProfilePage() {
  const navigate = useNavigate()
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [profileImage, setProfileImage] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auth/me")
        setUser(res.data?.data || res.data)
      } catch {
        try {
          const token = localStorage.getItem("access_token")
          if (token) {
            const p = JSON.parse(atob(token.split(".")[1]))
            setUser({
              name:       p.name       || "Admin User",
              email:      p.email      || "admin@learnify.com",
              role:       p.role       || "admin",
              phone:      p.phone      || null,
              created_at: p.created_at || null,
              status:     "active",
            })
          }
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const initials = getInitials(user?.name || "Admin")

  const fields = [
    { icon: User,     label: "Full Name",    value: user?.name  || "Admin User" },
    { icon: Mail,     label: "Email",         value: user?.email || "admin@learnify.com" },
    { icon: Phone,    label: "Phone Number",  value: user?.phone || "Not set" },
    { icon: Calendar, label: "Joined",        value: formatDate(user?.created_at) },
    { icon: Shield,   label: "Role",          value: (user?.role || "admin").charAt(0).toUpperCase() + (user?.role || "admin").slice(1) },
  ]

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4A7FA7] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#4A7FA7] hover:text-[#1A3D63] transition-colors font-body text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#0A1931] via-[#1A3D63] to-[#4A7FA7]" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">

            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                {profileImage ? (
                  <img src={profileImage} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63]
                    flex items-center justify-center">
                    <span className="font-heading font-bold text-white text-2xl">{initials}</span>
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            </div>

            <button
              onClick={() => navigate("/admin/profile/edit")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1931] text-white
                rounded-xl font-body text-sm font-semibold hover:bg-[#1A3D63] transition-colors"
            >
              <Edit3 size={15} />
              Edit Profile
            </button>
          </div>

          <div className="mb-2">
            <h2 className="font-heading font-bold text-xl text-[#0A1931]">{user?.name || "Admin User"}</h2>
            <p className="font-body text-sm text-gray-500 mt-0.5">{user?.email || "admin@learnify.com"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0A1931]
                text-white rounded-full font-body text-[11px] font-bold uppercase tracking-wider">
                <Shield size={10} />
                {user?.role || "admin"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50
                text-green-700 border border-green-100 rounded-full font-body text-[11px] font-semibold">
                <CheckCircle size={10} />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-heading font-semibold text-sm text-[#0A1931]">Account Details</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#F6FAFD] border border-[#B3CFE5]/30
                flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-[#4A7FA7]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                  {label}
                </p>
                <p className="font-body text-sm font-medium text-[#0A1931] mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/admin/profile/edit")}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100
            hover:border-[#B3CFE5] hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EBF3F9] group-hover:bg-[#4A7FA7]
            flex items-center justify-center transition-colors flex-shrink-0">
            <Edit3 size={17} className="text-[#4A7FA7] group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm text-[#0A1931]">Edit Profile</p>
            <p className="font-body text-xs text-gray-400">Update your information</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/change-password")}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100
            hover:border-[#B3CFE5] hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EBF3F9] group-hover:bg-[#0A1931]
            flex items-center justify-center transition-colors flex-shrink-0">
            <Lock size={17} className="text-[#4A7FA7] group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm text-[#0A1931]">Change Password</p>
            <p className="font-body text-xs text-gray-400">Update your password</p>
          </div>
        </button>
      </div>

    </div>
  )
}
