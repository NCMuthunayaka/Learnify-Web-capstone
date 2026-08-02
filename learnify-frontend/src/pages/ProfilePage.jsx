import { useState, useEffect } from "react"
import {
  User, Mail, Phone, BookOpen, GraduationCap,
  Save, Edit3, ArrowLeft
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Button from "../components/common/Button"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import { getProfile, updateProfile } from "../api/usersApi"

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
const MAX_BIO     = 300

function InputField({ label, icon: Icon, type = "text", value,
  onChange, name, disabled, error }) {
  return (
    <div>
      <label className="font-body text-xs text-gray-500 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-300" />
        )}
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5
            border rounded-lg font-body text-sm text-gray-700
            focus:outline-none transition-colors
            ${error
              ? "border-red-300 focus:border-red-400"
              : "border-gray-200 focus:border-[#4A7FA7]"}
            ${disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
              : "bg-white"}`}
        />
      </div>
      {error && (
        <p className="font-body text-[10px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "S"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfilePage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName:  "",
    lastName:   "",
    email:      "",
    phone:      "",
    university: "",
    faculty:    "",
    year:       "1st Year",
    studentId:  "",
    bio:        "",
  })
  const [originalData, setOriginalData] = useState({})
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState("")
  const [fieldErrors, setFieldErrors]   = useState({})
  const [activeTab, setActiveTab]       = useState("personal")

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response  = await getProfile()
        const user      = response.data
        const nameParts = (user.name || "").split(" ")
        const firstName = nameParts[0] || ""
        const lastName  = nameParts.slice(1).join(" ") || ""

        const data = {
          firstName,
          lastName,
          email:      user.email      || "",
          phone:      user.phone      || "",
          university: user.university || "",
          faculty:    user.faculty    || "",
          year:       user.year       || "1st Year",
          studentId:  user.student_id || "",
          bio:        user.bio        || "",
        }
        setFormData(data)
        setOriginalData(data)
      } catch {
        setError("Failed to load profile. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }))
    }
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
        name:       fullName,
        phone:      formData.phone,
        bio:        formData.bio,
        student_id: formData.studentId,
        university: formData.university,
        faculty:    formData.faculty,
        year:       formData.year,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Loading profile..." />
      </div>
    )
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Student"
  const initials = getInitials(fullName)

  return (
    <div className="max-w-3xl space-y-5">

      {/* ── Hero Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100
        overflow-hidden">

        {/* Gradient Banner */}
        <div className="h-28 bg-gradient-to-r from-[#0A1931] via-[#1A3D63]
          to-[#4A7FA7]" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end
            sm:justify-between gap-4 -mt-12 mb-6">

            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full ring-4 ring-white
                shadow-xl bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63]
                flex items-center justify-center">
                <span className="font-heading font-bold text-white text-2xl">
                  {initials}
                </span>
              </div>
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 w-4 h-4
                bg-green-400 rounded-full border-2 border-white" />
            </div>

            {/* Role Badge */}
            <span className="self-end sm:self-auto bg-blue-50 text-blue-600
              font-body text-xs font-semibold px-3 py-1.5 rounded-full
              border border-blue-100">
              Student
            </span>
          </div>

          {/* Name + Details */}
          <div>
            <h2 className="font-heading font-bold text-xl text-[#0A1931]">
              {fullName}
            </h2>
            <p className="font-body text-sm text-gray-500 mt-0.5">
              {formData.email}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {formData.studentId && (
                <span className="font-body text-xs text-gray-500
                  bg-gray-100 px-2.5 py-1 rounded-full">
                  {formData.studentId}
                </span>
              )}
              {formData.year && (
                <span className="font-body text-xs text-[#4A7FA7]
                  bg-blue-50 px-2.5 py-1 rounded-full">
                  {formData.year}
                </span>
              )}
              {formData.university && (
                <span className="font-body text-xs text-gray-500">
                  {formData.university}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved warning */}
      {hasChanges && !saving && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl
          px-4 py-3 flex items-center gap-2">
          <span className="text-yellow-500 text-sm">⚠️</span>
          <p className="font-body text-xs text-yellow-700 font-medium">
            You have unsaved changes
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError("")} />
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {["personal", "academic"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body text-sm font-medium px-5 py-2 rounded-lg
              transition-colors duration-200
              ${activeTab === tab
                ? "bg-[#1A3D63] text-white"
                : "bg-white text-gray-400 hover:text-[#1A3D63] border border-gray-200"}`}
          >
            {tab === "personal" ? "Personal Info" : "Academic Info"}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeTab === "personal" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading text-base font-semibold
            text-[#0A1931] mb-5">
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
              onChange={handleChange} error={fieldErrors.phone} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-xs text-gray-500">Bio</label>
              <span className={`font-body text-[10px]
                ${(formData.bio?.length || 0) > MAX_BIO
                  ? "text-red-400" : "text-gray-300"}`}>
                {formData.bio?.length || 0}/{MAX_BIO}
              </span>
            </div>
            <textarea name="bio" value={formData.bio}
              onChange={handleChange} rows={3}
              maxLength={MAX_BIO + 10}
              placeholder="Tell us a bit about yourself..."
              className={`w-full px-3 py-2.5 border rounded-lg
                font-body text-sm text-gray-700 focus:outline-none
                resize-none transition-colors
                ${fieldErrors.bio
                  ? "border-red-300"
                  : "border-gray-200 focus:border-[#4A7FA7]"}`} />
            {fieldErrors.bio && (
              <p className="font-body text-[10px] text-red-400 mt-1">
                {fieldErrors.bio}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Academic Info */}
      {activeTab === "academic" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading text-base font-semibold
            text-[#0A1931] mb-5">
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Student ID" icon={GraduationCap}
              name="studentId" value={formData.studentId}
              onChange={handleChange} />
            <div>
              <label className="font-body text-xs text-gray-500 mb-1.5 block">
                Year of Study
              </label>
              <select name="year" value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200
                  rounded-lg font-body text-sm text-gray-700
                  focus:outline-none focus:border-[#4A7FA7]">
                {yearOptions.map(y => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <InputField label="University" icon={BookOpen}
              name="university" value={formData.university}
              onChange={handleChange} />
            <InputField label="Faculty" icon={BookOpen}
              name="faculty" value={formData.faculty}
              onChange={handleChange} />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button variant="primary" icon={Save}
          onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {hasChanges && !saving && (
          <button
            onClick={() => { setFormData({ ...originalData }); setFieldErrors({}) }}
            className="font-body text-sm text-gray-400 hover:text-gray-600
              transition-colors"
          >
            Reset
          </button>
        )}
        {saved && (
          <span className="font-body text-sm text-green-500 font-medium">
            ✓ Changes saved successfully!
          </span>
        )}
      </div>

    </div>
  )
}

export default ProfilePage