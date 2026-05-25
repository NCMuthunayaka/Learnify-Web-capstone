import { useState } from "react"
import { User, Mail, Phone, BookOpen, GraduationCap, Save } from "lucide-react"
import Button from "../components/common/Button"

const initialData = {
  firstName:   "Nirmal",
  lastName:    "Chamara",
  email:       "nirmal@gmail.com",
  phone:       "076 555 6756",
  university:  "Sabaragamuwa University of Sri Lanka",
  faculty:     "Faculty of Computing",
  year:        "2nd Year",
  studentId:   "ICT/21/876",
  bio:         "Passionate about mathematics and physics. Aiming to excel in A/L exams.",
}

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

function InputField({ label, icon: Icon, type = "text", value, onChange, name, disabled }) {
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
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5
            border border-gray-200 rounded-lg font-body text-sm
            text-gray-700 focus:outline-none focus:border-[#4A7FA7]
            transition-colors
            ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white"}`}
        />
      </div>
    </div>
  )
}

function ProfilePage() {
  const [formData, setFormData] = useState(initialData)
  const [saved, setSaved]       = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#1A3D63] flex
            items-center justify-center flex-shrink-0">
            <span className="font-heading text-2xl font-bold text-white">
              {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-[#0A1931]">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="font-body text-sm text-gray-400 mt-0.5">
              {formData.studentId} · {formData.year}
            </p>
            <p className="font-body text-xs text-[#4A7FA7] mt-1">
              {formData.university}
            </p>
          </div>

          {/* Role Badge */}
          <span className="bg-blue-50 text-blue-600 font-body text-xs
            font-semibold px-3 py-1.5 rounded-full border border-blue-100">
            Student
          </span>

        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {["personal", "academic"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body text-sm font-medium px-5 py-2 rounded-lg transition-colors 
                        duration-200 capitalize ${activeTab === tab ? "bg-[#1A3D63] text-white" : "bg-white text-gray-400 hover:text-[#1A3D63] border border-gray-200"}`}
          >
            {tab === "personal" ? "Personal Info" : "Academic Info"}
          </button>
        ))}
      </div>

      {/* ── Personal Info Tab ── */}
      {activeTab === "personal" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm
          border border-gray-100">
          <h3 className="font-heading text-base font-semibold
            text-[#0A1931] mb-5">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              icon={User}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
            <InputField
              label="Last Name"
              icon={User}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Phone Number"
              icon={Phone}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4">
            <label className="font-body text-xs text-gray-500 mb-1.5 block">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200
                rounded-lg font-body text-sm text-gray-700
                focus:outline-none focus:border-[#4A7FA7]
                resize-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* ── Academic Info Tab ── */}
      {activeTab === "academic" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm
          border border-gray-100">
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
              disabled
            />
            <div>
              <label className="font-body text-xs text-gray-500
                mb-1.5 block">
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

      {/* ── Save Button ── */}
      <div className="flex items-center gap-3">
        <Button variant="primary" icon={Save} onClick={handleSave}>
          Save Changes
        </Button>
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

