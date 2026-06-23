import { useState, useEffect } from "react"
import { User, Mail, Phone, BookOpen, GraduationCap, Save } from "lucide-react"
import Button from "../components/common/Button"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import { getProfile, updateProfile } from "../api/usersApi"
import Avatar from "../components/common/Avatar"
import profileImg from "../assets/icons/profile.png"

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

function ProfilePage() {
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

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeTab, setActiveTab] = useState("personal")

  // ── Check if anything changed ──────────────────────────
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await getProfile()
        const user     = response.data

        const nameParts = (user.name || "").split(" ")
        const firstName = nameParts[0] || ""
        const lastName  = nameParts.slice(1).join(" ") || ""

        const data = {
          firstName:  firstName,
          lastName:   lastName,
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

      } catch (err) {
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
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  // ── Validate before save ───────────────────────────────
  function validate() {
    const errors = {}

    if (!formData.firstName.trim())
      errors.firstName = "First name is required"

    if (!formData.lastName.trim())
      errors.lastName = "Last name is required"

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

      // Update original to reflect saved state
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

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <Avatar
            src={profileImg}
            name={fullName}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-[#0A1931]">
              {fullName || "—"}
            </h2>
            <p className="font-body text-sm text-gray-400 mt-0.5">
              {formData.studentId || "No student ID"} · {formData.year}
            </p>
            <p className="font-body text-xs text-[#4A7FA7] mt-1">
              {formData.university || "No university set"}
            </p>
          </div>
          <span className="bg-blue-50 text-blue-600 font-body text-xs
            font-semibold px-3 py-1.5 rounded-full border border-blue-100">
            Student
          </span>
        </div>
      </div>

      {/* Unsaved changes warning */}
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
              transition-colors duration-200 capitalize
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
            <InputField
              label="First Name *"
              icon={User}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={fieldErrors.firstName}
            />
            <InputField
              label="Last Name *"
              icon={User}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={fieldErrors.lastName}
            />
            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
            <InputField
              label="Phone Number"
              icon={Phone}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
            />
          </div>

          {/* Bio with character count */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-xs text-gray-500">
                Bio
              </label>
              <span className={`font-body text-[10px]
                ${(formData.bio?.length || 0) > MAX_BIO
                  ? "text-red-400"
                  : "text-gray-300"}`}>
                {formData.bio?.length || 0}/{MAX_BIO}
              </span>
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              maxLength={MAX_BIO + 10}
              placeholder="Tell us a bit about yourself..."
              className={`w-full px-3 py-2.5 border rounded-lg
                font-body text-sm text-gray-700 focus:outline-none
                resize-none transition-colors
                ${fieldErrors.bio
                  ? "border-red-300"
                  : "border-gray-200 focus:border-[#4A7FA7]"}`}
            />
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
            <InputField
              label="Student ID"
              icon={GraduationCap}
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
            />
            <div>
              <label className="font-body text-xs text-gray-500 mb-1.5 block">
                Year of Study
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200
                  rounded-lg font-body text-sm text-gray-700
                  focus:outline-none focus:border-[#4A7FA7]"
              >
                {yearOptions.map(y => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <InputField
              label="University"
              icon={BookOpen}
              name="university"
              value={formData.university}
              onChange={handleChange}
            />
            <InputField
              label="Faculty"
              icon={BookOpen}
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={Save}
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        {/* Reset button — only show if unsaved changes */}
        {hasChanges && !saving && (
          <button
            onClick={() => {
              setFormData({ ...originalData })
              setFieldErrors({})
            }}
            className="font-body text-sm text-gray-400
              hover:text-gray-600 transition-colors"
          >
            Reset
          </button>
        )}

        {saved && (
          <span className="font-body text-sm text-green-500 font-medium
            flex items-center gap-1">
            ✓ Changes saved successfully!
          </span>
        )}
      </div>

    </div>
  )
}

export default ProfilePage