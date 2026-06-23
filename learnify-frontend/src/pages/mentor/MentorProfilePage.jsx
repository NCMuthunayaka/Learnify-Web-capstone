import { useState, useEffect } from "react"
import { User, Mail, Phone, BookOpen, Briefcase, Save } from "lucide-react"
import Button from "../../components/common/Button"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorMessage from "../../components/common/ErrorMessage"
import { getProfile, updateProfile } from "../../api/usersApi"
import { getSubjects } from "../../api/subjectsApi"

const experienceOptions = ["1–2 Years", "3–5 Years", "6–10 Years", "10+ Years"]
const MAX_BIO           = 300

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

function MentorProfilePage() {
  const [formData, setFormData] = useState({
    firstName:  "",
    lastName:   "",
    email:      "",
    phone:      "",
    university: "",
    department: "",
    subject:    "",
    experience: "",
    bio:        "",
  })
  const [originalData, setOriginalData] = useState({})
  const [subjects, setSubjects]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState("")
  const [fieldErrors, setFieldErrors]   = useState({})
  const [activeTab, setActiveTab]       = useState("personal")

  // ── Check if anything changed ──────────────────────────
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
          firstName:  firstName,
          lastName:   lastName,
          email:      user.email      || "",
          phone:      user.phone      || "",
          university: user.university || "",
          department: user.department || "",
          subject:    user.subject    || "",
          experience: user.experience || experienceOptions[0],
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
    fetchAll()
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
        university: formData.university,
        department: formData.department,
        subject:    formData.subject,
        experience: formData.experience,
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

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Mentor"
  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#4A7FA7] flex
            items-center justify-center flex-shrink-0">
            <span className="font-heading text-2xl font-bold text-white">
              {initials || "M"}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-[#0A1931]">
              {fullName}
            </h2>
            <p className="font-body text-sm text-gray-400 mt-0.5">
              {formData.subject || "No subject set"} · {formData.experience || ""}
            </p>
            <p className="font-body text-xs text-[#4A7FA7] mt-1">
              {formData.university || "No university set"}
            </p>
          </div>
          <span className="bg-green-50 text-green-600 font-body text-xs
            font-semibold px-3 py-1.5 rounded-full border border-green-100">
            Mentor
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
        {["personal", "professional"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body text-sm font-medium px-5 py-2 rounded-lg
              transition-colors duration-200 capitalize
              ${activeTab === tab
                ? "bg-[#1A3D63] text-white"
                : "bg-white text-gray-400 hover:text-[#1A3D63] border border-gray-200"}`}
          >
            {tab === "personal" ? "Personal Info" : "Professional Info"}
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

          {/* Bio with character count */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-xs text-gray-500">Bio</label>
              <span className={`font-body text-[10px]
                ${(formData.bio?.length || 0) > MAX_BIO
                  ? "text-red-400" : "text-gray-300"}`}>
                {formData.bio?.length || 0}/{MAX_BIO}
              </span>
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              maxLength={MAX_BIO + 10}
              placeholder="Tell students about yourself..."
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

      {/* Professional Info */}
      {activeTab === "professional" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading text-base font-semibold
            text-[#0A1931] mb-5">
            Professional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="University" icon={BookOpen}
              name="university" value={formData.university}
              onChange={handleChange} />
            <InputField label="Department" icon={Briefcase}
              name="department" value={formData.department}
              onChange={handleChange} />

            <div>
              <label className="font-body text-xs text-gray-500 mb-1.5 block">
                Subject
              </label>
              <select name="subject" value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200
                  rounded-lg font-body text-sm text-gray-700
                  focus:outline-none focus:border-[#4A7FA7]">
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-body text-xs text-gray-500 mb-1.5 block">
                Teaching Experience
              </label>
              <select name="experience" value={formData.experience}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200
                  rounded-lg font-body text-sm text-gray-700
                  focus:outline-none focus:border-[#4A7FA7]">
                {experienceOptions.map(e => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button variant="primary" icon={Save}
          onClick={handleSave}
          disabled={saving || !hasChanges}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>

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
          <span className="font-body text-sm text-green-500 font-medium">
            ✓ Changes saved successfully!
          </span>
        )}
      </div>

    </div>
  )
}

export default MentorProfilePage