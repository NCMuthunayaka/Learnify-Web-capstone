import { useState, useEffect } from "react"
import {
  User, Mail, Phone, BookOpen, Briefcase,
  Save, Trash2, AlertTriangle, Eye, EyeOff
} from "lucide-react"
import Button from "../../components/common/Button"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorMessage from "../../components/common/ErrorMessage"
import Modal from "../../components/common/Modal"
import Avatar from "../../components/common/Avatar"
import profileImg from "../../assets/icons/profile.png"
import { getProfile, updateProfile, deleteAccount } from "../../api/usersApi"
import { getSubjects } from "../../api/subjectsApi"

const experienceOptions = ["1–2 Years", "3–5 Years", "6–10 Years", "10+ Years"]
const MAX_BIO           = 300

function InputField({ label, icon: Icon, type = "text", value,
  onChange, name, disabled, error, placeholder }) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword            = type === "password"
  const actualType            = isPassword ? (showPwd ? "text" : "password") : type

  return (
    <div>
      <label className="font-body text-xs font-semibold text-slate-600 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2
            -translate-y-1/2 text-slate-400" />
        )}
        <input
          type={actualType}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-10" : "pl-3.5"} ${isPassword ? "pr-10" : "pr-3.5"} py-2.5
            border rounded-xl font-body text-sm text-slate-800 shadow-xs
            focus:outline-none transition-all duration-200
            ${error
              ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-200"
              : "border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#3b719f] focus:ring-2 focus:ring-[#3b719f]/15"}
            ${disabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200/60"
              : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="font-body text-[10px] text-red-500 font-semibold mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "M"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function MentorProfilePage() {
  const [formData, setFormData] = useState({
    firstName:    "",
    lastName:     "",
    email:        "",
    phone:        "",
    university:   "",
    department:   "",
    subject:      "",
    experience:   "",
    bio:          "",
    is_available: true,
  })
  const [originalData, setOriginalData] = useState({})
  const [subjects, setSubjects]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState("")
  const [fieldErrors, setFieldErrors]   = useState({})
  const [activeTab, setActiveTab]       = useState("personal")

  // Delete account states
  const [showDeleteModal, setShowDeleteModal]       = useState(false)
  const [deletePassword, setDeletePassword]         = useState("")
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deletingAccount, setDeletingAccount]       = useState(false)
  const [deleteError, setDeleteError]               = useState("")

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)
        const [profileRes, subjectsRes] = await Promise.all([
          getProfile(),
          getSubjects(),
        ])

        const user        = profileRes.data
        const subjectList = subjectsRes.data || []
        setSubjects(subjectList)

        const nameParts = (user.name || "").split(" ")
        const firstName = nameParts[0] || ""
        const lastName  = nameParts.slice(1).join(" ") || ""

        const data = {
          firstName,
          lastName,
          email:        user.email        || "",
          phone:        user.phone        || "",
          university:   user.university   || "",
          department:   user.department   || "",
          subject:      user.subject      || "",
          experience:   user.experience   || experienceOptions[0],
          bio:          user.bio          || "",
          is_available: user.is_available !== false,
        }

        setFormData(data)
        setOriginalData(data)
      } catch {
        setError("Failed to load profile. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  function handleAvailabilityToggle() {
    setFormData(prev => ({ ...prev, is_available: !prev.is_available }))
  }

  function validate() {
    const errors = {}
    if (!formData.firstName.trim()) errors.firstName = "First name is required"
    if (!formData.lastName.trim())  errors.lastName  = "Last name is required"
    if (formData.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone))
      errors.phone = "Please enter a valid phone number"
    if (formData.bio && formData.bio.length > MAX_BIO)
      errors.bio = `Bio must be under ${MAX_BIO} characters`
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    setError("")
    setSaved(false)
    if (!validate()) return

    try {
      setSaving(true)
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      await updateProfile({
        name:         fullName,
        phone:        formData.phone,
        bio:          formData.bio,
        university:   formData.university,
        department:   formData.department,
        subject:      formData.subject,
        experience:   formData.experience,
        is_available: formData.is_available,
      })
      setOriginalData({ ...formData })
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        "Failed to save changes. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    try {
      setDeletingAccount(true)
      setDeleteError("")
      await deleteAccount(deletePassword)
      localStorage.clear()
      window.location.href = "/login"
    } catch (err) {
      setDeleteError(
        err.response?.data?.error?.message ||
        "Failed to delete account. Please check your password."
      )
    } finally {
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Loading profile..." />
      </div>
    )
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Mentor"

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Main Unified Card ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md
        border border-slate-200/80 space-y-6">

        {/* ── Hero Gradient Header ── */}
        <div className="bg-gradient-to-r from-[#0A1931] via-[#1A3D63]
          to-[#2B547E] rounded-3xl p-6 sm:p-7 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row items-start
            sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">

              {/* Avatar with availability dot */}
              <div className="relative">
                <div className="ring-4 ring-white/20 rounded-full shadow-md">
                  <Avatar src={profileImg} name={fullName} size="lg" />
                </div>
                <span className={`absolute bottom-1 right-1 w-4 h-4
                  rounded-full border-2 border-white transition-colors
                  ${formData.is_available ? "bg-green-400" : "bg-gray-400"}`}
                />
              </div>

              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold
                  text-white tracking-wide">
                  {fullName || "—"}
                </h2>
                <p className="font-body text-xs text-blue-200 mt-1
                  font-medium flex items-center gap-1.5">
                  <Briefcase size={13} className="text-blue-300 shrink-0" />
                  {formData.subject || "No subject set"}
                  {formData.experience ? ` · ${formData.experience}` : ""}
                </p>
                <p className="font-body text-xs text-blue-100/80 mt-0.5
                  flex items-center gap-1.5">
                  <Mail size={13} className="text-blue-300 shrink-0" />
                  {formData.email}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/15 backdrop-blur-md text-white
                font-body text-xs font-bold px-4 py-1.5 rounded-full
                border border-white/25">
                Mentor
              </span>
              <span className={`font-body text-xs font-bold px-4 py-1.5
                rounded-full border backdrop-blur-md
                ${formData.is_available
                  ? "bg-green-500/20 text-green-200 border-green-400/30"
                  : "bg-white/10 text-white/50 border-white/20"}`}>
                {formData.is_available ? "🟢 Available" : "🔴 Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Unsaved warning */}
        {hasChanges && !saving && (
          <div className="bg-yellow-50 border border-yellow-200/90
            rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-yellow-500 text-sm">⚠️</span>
            <p className="font-body text-xs text-yellow-800 font-semibold">
              You have unsaved changes
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* Tabs */}
        <div className="bg-[#F1F5F9] p-1.5 rounded-2xl border
          border-slate-200/80 flex flex-wrap gap-1.5">
          {["personal", "professional"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-body text-xs sm:text-sm font-bold px-5
                py-2.5 rounded-xl transition-all capitalize cursor-pointer
                border-none
                ${activeTab === tab
                  ? "bg-[#1A3D63] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0A1931] hover:bg-white/60"}`}
            >
              {tab === "personal" ? "Personal Info" : "Professional Info"}
            </button>
          ))}
        </div>

        {/* ── Personal Info Tab ── */}
        {activeTab === "personal" && (
          <div className="bg-[#F8FAFC] rounded-2xl p-6 border
            border-slate-200/80 space-y-5">
            <h3 className="font-heading text-base font-bold text-[#0A1931]">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First Name *" icon={User}
                name="firstName" value={formData.firstName}
                onChange={handleChange} error={fieldErrors.firstName} />
              <InputField label="Last Name *" icon={User}
                name="lastName" value={formData.lastName}
                onChange={handleChange} error={fieldErrors.lastName} />
              <InputField label="Email Address" icon={Mail}
                type="email" name="email" value={formData.email}
                onChange={handleChange} disabled />
              <InputField label="Phone Number" icon={Phone}
                name="phone" value={formData.phone}
                onChange={handleChange} error={fieldErrors.phone}
                placeholder="+94 77 123 4567" />
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-xs font-semibold
                  text-slate-600">
                  Bio
                </label>
                <span className={`font-body text-[10px] ${
                  (formData.bio?.length || 0) > MAX_BIO
                    ? "text-red-500 font-bold"
                    : "text-slate-400"}`}>
                  {formData.bio?.length || 0}/{MAX_BIO}
                </span>
              </div>
              <textarea name="bio" value={formData.bio}
                onChange={handleChange} rows={3}
                maxLength={MAX_BIO + 10}
                placeholder="Tell students about your teaching style..."
                className={`w-full px-3.5 py-2.5 border rounded-xl
                  shadow-xs font-body text-sm text-slate-800
                  focus:outline-none resize-none transition-all duration-200
                  ${fieldErrors.bio
                    ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-200"
                    : "border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#3b719f] focus:ring-2 focus:ring-[#3b719f]/15"}`}
              />
              {fieldErrors.bio && (
                <p className="font-body text-[10px] text-red-500
                  font-semibold mt-1">
                  {fieldErrors.bio}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Professional Info Tab ── */}
        {activeTab === "professional" && (
          <div className="bg-[#F8FAFC] rounded-2xl p-6 border
            border-slate-200/80 space-y-6">
            <h3 className="font-heading text-base font-bold text-[#0A1931]">
              Professional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="University" icon={BookOpen}
                name="university" value={formData.university}
                onChange={handleChange}
                placeholder="e.g. Sabaragamuwa University of Sri Lanka" />
              <InputField label="Department" icon={Briefcase}
                name="department" value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Department of Software Engineering" />

              <div>
                <label className="font-body text-xs font-semibold
                  text-slate-600 mb-1.5 block">
                  Subject
                </label>
                <select name="subject" value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200
                    rounded-xl bg-[#F8FAFC] focus:bg-white font-body text-sm
                    text-slate-800 focus:outline-none focus:border-[#3b719f]
                    focus:ring-2 focus:ring-[#3b719f]/15 cursor-pointer
                    transition-all shadow-xs">
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-xs font-semibold
                  text-slate-600 mb-1.5 block">
                  Teaching Experience
                </label>
                <select name="experience" value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200
                    rounded-xl bg-[#F8FAFC] focus:bg-white font-body text-sm
                    text-slate-800 focus:outline-none focus:border-[#3b719f]
                    focus:ring-2 focus:ring-[#3b719f]/15 cursor-pointer
                    transition-all shadow-xs">
                  {experienceOptions.map(e => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Availability Toggle ── */}
            <div className="pt-5 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold
                    text-[#0A1931]">
                    Availability Status
                  </p>
                  <p className="font-body text-xs text-slate-400 mt-0.5">
                    {formData.is_available
                      ? "Students can see you are available for help"
                      : "Students will see you as unavailable"}
                  </p>
                </div>
                <button
                  onClick={handleAvailabilityToggle}
                  className={`relative inline-flex h-7 w-14 items-center
                    rounded-full transition-colors duration-300
                    focus:outline-none
                    ${formData.is_available
                      ? "bg-[#3b719f]"
                      : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-5 w-5 transform
                    rounded-full bg-white shadow-md transition-transform
                    duration-300
                    ${formData.is_available
                      ? "translate-x-8"
                      : "translate-x-1"}`}
                  />
                </button>
              </div>
              <div className="mt-3">
                <span className={`font-body text-xs font-semibold px-3
                  py-1.5 rounded-full border inline-block
                  ${formData.is_available
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                  {formData.is_available ? "🟢 Available" : "🔴 Unavailable"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6
          border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Button variant="primary" icon={Save}
              onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {hasChanges && !saving && (
              <button
                onClick={() => {
                  setFormData({ ...originalData })
                  setFieldErrors({})
                }}
                className="font-body text-xs text-gray-400
                  hover:text-gray-600 transition-colors cursor-pointer
                  border-none bg-transparent"
              >
                Reset
              </button>
            )}
          </div>
          {saved && (
            <span className="font-body text-xs text-green-600 font-bold">
              ✓ Changes saved successfully!
            </span>
          )}
        </div>

      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-red-50/60 rounded-3xl p-6 border
        border-red-100 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <Trash2 size={18} />
          <h3 className="font-heading text-base font-bold">Danger Zone</h3>
        </div>
        <p className="font-body text-xs text-gray-600 leading-relaxed">
          Permanently delete your mentor account and remove all your data,
          resources, and messages. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true)
            setDeleteError("")
            setDeletePassword("")
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-body
            text-xs font-bold px-4 py-2.5 rounded-xl transition-colors
            border-none cursor-pointer flex items-center gap-2"
        >
          <Trash2 size={14} />
          Delete Account
        </button>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Your Account">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-2xl border
              border-red-100 space-y-2">
              <div className="flex items-center gap-2 text-red-800
                font-heading text-sm font-bold">
                <AlertTriangle size={18} />
                Warning: Permanent Action
              </div>
              <p className="font-body text-xs text-red-700 leading-relaxed">
                Deleting your account will permanently wipe your mentor
                profile, resources, messages, and responses.
              </p>
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold
                text-gray-500 uppercase tracking-wider block mb-1">
                Enter Your Password to Confirm
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#f2f1ed] text-gray-800 font-body
                    text-xs px-4 py-3 pr-10 rounded-2xl border-none
                    focus:outline-none focus:ring-1 focus:ring-red-400"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                >
                  {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {deleteError && (
              <p className="font-body text-xs text-red-600 font-bold">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2
              border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="font-body text-xs font-bold text-gray-500
                  hover:text-gray-800 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-body
                  text-xs font-bold px-5 py-2.5 rounded-full transition-colors
                  border-none cursor-pointer disabled:opacity-50"
              >
                {deletingAccount ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default MentorProfilePage