import { useState, useEffect } from "react"
import { 
  User, Mail, Phone, BookOpen, GraduationCap, Save, Trash2, AlertTriangle,
  Award, CheckCircle2, Clock, XCircle, Plus, Sparkles, ShieldCheck
} from "lucide-react"
import Button from "../components/common/Button"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import Modal from "../components/common/Modal"
import { getProfile, updateProfile, deleteAccount, getMentorEligibility, applyForMentor } from "../api/usersApi"
import Avatar from "../components/common/Avatar"
import profileImg from "../assets/icons/profile.png"

const yearOptions   = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate / Masters"]
const gradeOptions  = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11 (O/L)", "Grade 12 (A/L)", "Grade 13 (A/L)"]
const streamOptions = ["Physical Science / Maths", "Biological Science", "Commerce", "Arts", "Technology (Engineering/Bio)", "General Studies"]
const MAX_BIO       = 300

function InputField({ label, icon: Icon, type = "text", value,
  onChange, name, disabled, error, placeholder }) {
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
          placeholder={placeholder}
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
    firstName:      "",
    lastName:       "",
    email:          "",
    phone:          "",
    educationLevel: "university",
    schoolName:     "",
    gradeLevel:     "Grade 12 (A/L)",
    streamFocus:    "Physical Science / Maths",
    university:     "",
    faculty:        "",
    year:           "1st Year",
    studentId:      "",
    bio:            "",
  })
  const [originalData, setOriginalData] = useState({})

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeTab, setActiveTab] = useState("personal")

  // ── Mentor Application States ────────────────────────────
  const [eligibility, setEligibility]         = useState(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(false)
  const [showApplyModal, setShowApplyModal]     = useState(false)
  const [appQualifications, setAppQualifications] = useState("")
  const [appCertifications, setAppCertifications] = useState("")
  const [submittingApp, setSubmittingApp]       = useState(false)
  const [appError, setAppError]                 = useState("")
  const [appSuccess, setAppSuccess]             = useState("")

  // ── Check if anything changed ──────────────────────────
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  async function loadEligibility() {
    try {
      setEligibilityLoading(true)
      const res = await getMentorEligibility()
      setEligibility(res.data)
      if (res.data?.application) {
        setAppQualifications(res.data.application.qualifications || "")
        setAppCertifications(res.data.application.certifications || "")
      }
    } catch (err) {
      console.error("Failed to load mentor eligibility:", err)
    } finally {
      setEligibilityLoading(false)
    }
  }

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
          firstName:      firstName,
          lastName:       lastName,
          email:          user.email           || "",
          phone:          user.phone           || "",
          educationLevel: user.education_level || "university",
          schoolName:     user.school_name     || "",
          gradeLevel:     user.grade_level     || "Grade 12 (A/L)",
          streamFocus:    user.stream_focus    || "Physical Science / Maths",
          university:     user.university      || "",
          faculty:        user.faculty         || "",
          year:           user.year            || "1st Year",
          studentId:      user.student_id      || "",
          bio:            user.bio             || "",
        }

        setFormData(data)
        setOriginalData(data)
        loadEligibility()

      } catch (err) {
        setError("Failed to load profile. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  async function handleApplySubmit(e) {
    if (e) e.preventDefault()
    setAppError("")
    setAppSuccess("")

    if (!appQualifications.trim() || !appCertifications.trim()) {
      setAppError("Please fill out both educational qualifications and certifications.")
      return
    }

    try {
      setSubmittingApp(true)
      await applyForMentor(appQualifications.trim(), appCertifications.trim())
      setAppSuccess("Your application to become a Mentor has been submitted to the Admin successfully!")
      setShowApplyModal(false)
      loadEligibility()
    } catch (err) {
      setAppError(
        err.response?.data?.error?.message || "Failed to submit mentor application. Please try again."
      )
    } finally {
      setSubmittingApp(false)
    }
  }

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
        name:            fullName,
        phone:           formData.phone,
        bio:             formData.bio,
        education_level: formData.educationLevel,
        school_name:     formData.schoolName,
        grade_level:     formData.gradeLevel,
        stream_focus:    formData.streamFocus,
        student_id:      formData.studentId,
        university:      formData.university,
        faculty:         formData.faculty,
        year:            formData.year,
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

  // Delete Account Handler
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword]   = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError]         = useState("")

  async function handleConfirmDelete() {
    try {
      setDeletingAccount(true)
      setDeleteError("")
      await deleteAccount(deletePassword)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
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

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Student"

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Main Unified Profile Container Card ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">

        {/* ── Profile Header Bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar
              src={profileImg}
              name={fullName}
              size="lg"
            />
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0A1931]">
                {fullName || "—"}
              </h2>
              <p className="font-body text-xs text-gray-500 mt-0.5 font-medium">
                {formData.educationLevel === "school"
                  ? `${formData.schoolName || "School Student"} · ${formData.gradeLevel}`
                  : formData.educationLevel === "other"
                  ? `${formData.schoolName || "Independent Learner"} · ${formData.streamFocus}`
                  : `${formData.university || "University Student"} · ${formData.year}`}
              </p>
              <p className="font-body text-xs text-[#3b719f] mt-0.5">
                {formData.email}
              </p>
            </div>
          </div>
          <span className="bg-blue-50 text-[#3b719f] font-body text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-100 capitalize">
            {formData.role || "Student"}
          </span>
        </div>

        {/* Unsaved changes warning */}
        {hasChanges && !saving && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-2">
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
          {["personal", "academic", "mentor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-body text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all capitalize cursor-pointer border-none ${
                activeTab === tab
                  ? "bg-[#1A3D63] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "personal"
                ? "Personal Info"
                : tab === "academic"
                ? "Academic Info"
                : "Mentor Application"}
            </button>
          ))}
        </div>

      {/* ── Tab 3: Mentor Application ── */}
      {activeTab === "mentor" && (
        <div className="space-y-5">
          {/* Status Message Banners */}
          {appSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl font-body text-xs font-semibold flex items-center justify-between">
              <span>{appSuccess}</span>
              <button onClick={() => setAppSuccess("")} className="bg-transparent border-none text-green-700 cursor-pointer font-bold">✕</button>
            </div>
          )}

          {/* Interaction & Assistance Score Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0A1931] flex items-center gap-2">
                  <Award size={18} className="text-[#3b719f]" />
                  Peer Assistance & Activity Requirements
                </h3>
                <p className="font-body text-xs text-gray-500 mt-1">
                  To ensure quality mentorship, students must actively assist peers in the community before applying.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Assistance Counter */}
              <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-body text-gray-600">
                  <span className="font-semibold">Peer Assistance / Responses</span>
                  <span className="font-bold text-[#3b719f]">
                    {eligibility?.current_assistance_count || 0} / {eligibility?.required_assistance_count || 3}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3b719f] h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((eligibility?.current_assistance_count || 0) / (eligibility?.required_assistance_count || 3)) * 100
                      )}%`
                    }}
                  />
                </div>
                <p className="font-body text-[11px] text-gray-400">
                  Public forum answers & direct peer assistance messages.
                </p>
              </div>

              {/* Activity Points Counter */}
              <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-body text-gray-600">
                  <span className="font-semibold">Activity & Progress Points</span>
                  <span className="font-bold text-amber-600">
                    {eligibility?.current_points || 0} / {eligibility?.required_points || 30} pts
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((eligibility?.current_points || 0) / (eligibility?.required_points || 30)) * 100
                      )}%`
                    }}
                  />
                </div>
                <p className="font-body text-[11px] text-gray-400">
                  Earned through active platform participation & study goals.
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility Banner / Application Trigger */}
          {eligibilityLoading ? (
            <div className="text-center py-6 text-xs text-gray-400 font-body">Checking mentor eligibility...</div>
          ) : !eligibility?.is_eligible ? (
            /* NOT ELIGIBLE BANNER */
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-heading text-sm font-bold">
                <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                Not Eligible to Apply as a Mentor Right Now
              </div>
              <p className="font-body text-xs text-amber-800 leading-relaxed">
                You have not reached the required peer assistance score yet. To qualify as a mentor, you need to actively interact and assist peers in the community (at least 3 peer responses or 30 activity points). Please assist more students and try again later!
              </p>
              <button
                disabled
                className="bg-gray-200 text-gray-500 font-body text-xs font-semibold px-5 py-2.5 rounded-xl cursor-not-allowed border-none"
              >
                Apply to Become a Mentor (Locked)
              </button>
            </div>
          ) : eligibility?.application?.status === "pending" ? (
            /* PENDING REVIEW BANNER */
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-heading text-sm font-bold">
                <Clock size={20} className="text-blue-600 shrink-0" />
                Application Under Review by Admin
              </div>
              <p className="font-body text-xs text-blue-800 leading-relaxed">
                Your application to become an official Mentor was submitted on{" "}
                {eligibility.application.created_at ? new Date(eligibility.application.created_at).toLocaleDateString() : "recently"}{" "}
                and is currently under review by the Administrator. You will receive a notification once your application is reviewed.
              </p>
              <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-1 font-body text-xs">
                <p className="font-semibold text-gray-700">Submitted Qualifications:</p>
                <p className="text-gray-600">{eligibility.application.qualifications}</p>
                <p className="font-semibold text-gray-700 pt-2">Submitted Certifications:</p>
                <p className="text-gray-600">{eligibility.application.certifications}</p>
              </div>
            </div>
          ) : eligibility?.application?.status === "approved" || eligibility?.user_role === "mentor" ? (
            /* APPROVED BANNER */
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-green-900 font-heading text-sm font-bold">
                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                Congratulations! You are an Approved Mentor
              </div>
              <p className="font-body text-xs text-green-800 leading-relaxed">
                Your mentor application has been approved by the Administrator. You now have full access to mentor tools, student request assignments, and mentor dashboard.
              </p>
            </div>
          ) : (
            /* QUALIFIED TO APPLY BANNER */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-900 font-heading text-sm font-bold">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                  You Are Qualified to Apply as a Mentor!
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowApplyModal(true)}
                >
                  <Sparkles size={14} className="mr-1.5" />
                  Apply to Become a Mentor
                </Button>
              </div>
              <p className="font-body text-xs text-emerald-800 leading-relaxed">
                You have successfully met the peer assistance requirement. Click the button above to open the application popup and submit your educational qualifications and certifications to the Admin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Mentor Application Form ── */}
      {showApplyModal && (
        <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for Mentor Verification">
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <p className="font-body text-xs text-gray-600">
              Submit your academic qualifications and certifications below. Your application will be sent directly to the Admin for review.
            </p>

            {appError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl font-body text-xs font-semibold">
                {appError}
              </div>
            )}

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Educational Qualifications *
              </label>
              <textarea
                rows={3}
                value={appQualifications}
                onChange={(e) => setAppQualifications(e.target.value)}
                placeholder="e.g. B.Sc in Computer Science (Final Year), GPA 3.85 / 4.00"
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs p-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f] resize-none"
              />
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Certifications & Specializations *
              </label>
              <textarea
                rows={3}
                value={appCertifications}
                onChange={(e) => setAppCertifications(e.target.value)}
                placeholder="e.g. AWS Certified Cloud Practitioner, Python Specialist Certificate, 2 years peer tutoring"
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs p-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="font-body text-xs font-bold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingApp}>
                {submittingApp ? "Submitting..." : "Submit Application to Admin"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h3 className="font-heading text-base font-semibold text-[#0A1931] mb-1">
              Academic Information
            </h3>
            <p className="font-body text-xs text-gray-500">
              Select your education level to customize your academic profile fields.
            </p>
          </div>

          {/* Education Level Type Selector Cards */}
          <div>
            <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-2">
              Education Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "school", label: "School Student", desc: "Grade / High School", icon: "🏫" },
                { id: "university", label: "University Student", desc: "Undergraduate / Postgrad", icon: "🎓" },
                { id: "other", label: "Other / Learner", desc: "Self-taught / Institute", icon: "💡" },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, educationLevel: opt.id }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.educationLevel === opt.id
                      ? "border-[#3b719f] bg-blue-50/50 shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <div className="font-heading text-xs font-bold text-[#0A1931]">{opt.label}</div>
                  <div className="font-body text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Fields for School Students ── */}
          {formData.educationLevel === "school" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <InputField
                label="School Name *"
                icon={BookOpen}
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="e.g. Royal College, Colombo"
              />
              <div>
                <label className="font-body text-xs text-gray-500 mb-1.5 block">
                  Grade / Class Level *
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7] cursor-pointer"
                >
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="font-body text-xs text-gray-500 mb-1.5 block">
                  Stream / Subject Focus
                </label>
                <select
                  name="streamFocus"
                  value={formData.streamFocus}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7] cursor-pointer"
                >
                  {streamOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Fields for University Students ── */}
          {formData.educationLevel === "university" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <InputField
                label="University Name *"
                icon={BookOpen}
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="e.g. Sabaragamuwa University of Sri Lanka"
              />
              <InputField
                label="Faculty / Department *"
                icon={BookOpen}
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                placeholder="e.g. Faculty of Computing / Software Engineering"
              />
              <div>
                <label className="font-body text-xs text-gray-500 mb-1.5 block">
                  Year of Study *
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7] cursor-pointer"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <InputField
                label="Student / Registration ID"
                icon={GraduationCap}
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. 2022/SE/045"
              />
            </div>
          )}

          {/* ── Fields for Other / Independent Learners ── */}
          {formData.educationLevel === "other" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <InputField
                label="Institution / Organization"
                icon={BookOpen}
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="e.g. Online Academy, Vocational Institute, Self-Taught"
              />
              <InputField
                label="Field of Study / Primary Focus"
                icon={GraduationCap}
                name="streamFocus"
                value={formData.streamFocus}
                onChange={handleChange}
                placeholder="e.g. Web Development, Data Science, General Studies"
              />
            </div>
          )}
        </div>
      )}

        {/* Save Button */}
        {activeTab !== "mentor" && (
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
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
                  className="font-body text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Reset
                </button>
              )}
            </div>

            {saved && (
              <span className="font-body text-xs text-green-600 font-bold flex items-center gap-1">
                ✓ Changes saved successfully!
              </span>
            )}
          </div>
        )}

      </div>

      {/* ── Danger Zone: Delete Account ── */}
      <div className="bg-red-50/60 rounded-3xl p-6 border border-red-100 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <Trash2 size={18} />
          <h3 className="font-heading text-base font-bold">Danger Zone</h3>
        </div>
        <p className="font-body text-xs text-gray-600 leading-relaxed">
          Permanently delete your Learnify account and remove all your data, messages, and study progress. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => { setShowDeleteModal(true); setDeleteError(""); setDeletePassword(""); }}
          className="bg-red-600 hover:bg-red-700 text-white font-body text-xs font-bold px-4 py-2.5 rounded-xl transition-colors border-none cursor-pointer flex items-center gap-2"
        >
          <Trash2 size={14} />
          Delete Account
        </button>
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Your Account">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-heading text-sm font-bold">
                <AlertTriangle size={18} />
                Warning: Permanent Action
              </div>
              <p className="font-body text-xs text-red-700 leading-relaxed">
                Deleting your account will permanently wipe your profile, study progress, messages, and help requests.
              </p>
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Enter Your Password to Confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            {deleteError && (
              <p className="font-body text-xs text-red-600 font-bold">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="font-body text-xs font-bold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-body text-xs font-bold px-5 py-2.5 rounded-full transition-colors border-none cursor-pointer disabled:opacity-50"
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

export default ProfilePage