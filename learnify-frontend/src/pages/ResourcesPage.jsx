import { useState } from "react"
import { Search, Upload, Download, Eye, ChevronLeft, ChevronRight, X } from "lucide-react"
import Button from "../components/common/Button"
import Badge from "../components/common/Badge"
import Modal from "../components/common/Modal"
import Tooltip from "../components/common/Tooltip"


// ── Data ──────────────────────────────────────────────────
const resources = [
  { id: 1, title: "Organic Chemistry — Reaction Mechanisms", subject: "Chemistry", mentor: "Mr. Fernando", mentorInitials: "SF", mentorColor: "bg-green-500", type: "PDF", uploaded: "28 Apr 2026", size: "3.2 MB" },
  { id: 2, title: "Wave Interference & Diffraction — Complete Notes", subject: "Physics", mentor: "Mr. Senaratne", mentorInitials: "RS", mentorColor: "bg-green-600", type: "PDF", uploaded: "25 Apr 2026", size: "5.8 MB" },
  { id: 3, title: "Calculus Integration — Practice Problems Set 3", subject: "Mathematics", mentor: "Mr. Rajendran", mentorInitials: "KR", mentorColor: "bg-purple-500", type: "PDF", uploaded: "24 Apr 2026", size: "1.4 MB" },
  { id: 4, title: "Cell Division — Mitosis & Meiosis Diagrams", subject: "Biology", mentor: "Ms. Balasubrama", mentorInitials: "AB", mentorColor: "bg-orange-500", type: "Video", uploaded: "23 Apr 2026", size: "42.3 MB" },
  { id: 5, title: "Essay Writing Techniques — A/L Exam Preparation", subject: "English", mentor: "Ms. Wijesinghe", mentorInitials: "NW", mentorColor: "bg-red-500", type: "DOCX", uploaded: "22 Apr 2026", size: "891 KB" },
  { id: 6, title: "Sri Lanka History — Colonial Period Summary", subject: "History", mentor: "Mr. Gamini Silva", mentorInitials: "GS", mentorColor: "bg-blue-500", type: "PPTX", uploaded: "20 Apr 2026", size: "7.6 MB" },
  { id: 7, title: "Electrochemistry — Full Notes & MCQ Bank", subject: "Chemistry", mentor: "Mr. Fernando", mentorInitials: "SF", mentorColor: "bg-green-500", type: "PDF", uploaded: "18 Apr 2026", size: "12.4 MB" },
  { id: 8, title: "Mechanics — Newton's Laws Video Lesson", subject: "Physics", mentor: "Mr. Vigneswaran", mentorInitials: "KV", mentorColor: "bg-teal-500", type: "Video", uploaded: "17 Apr 2026", size: "220.0 MB" },
]

const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "History"]
const subjectCount = { "All Subjects": 24, Mathematics: 7, Physics: 5, Chemistry: 6, Biology: 4, English: 2 }
const typeOptions = ["All Types", "PDF", "Video", "DOCX", "PPTX"]
const mentorOptions = ["All Mentors", "Mr. Fernando", "Mr. Senaratne", "Mr. Rajendran", "Ms. Balasubrama", "Ms. Wijesinghe", "Mr. Gamini Silva", "Mr. Vigneswaran"]
const sortOptions = ["Newest First", "Oldest First", "A–Z", "Z–A"]

// ── Type Badge ─────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = {
    PDF: "bg-red-100 text-red-600 border border-red-200",
    Video: "bg-blue-100 text-blue-600 border border-blue-200",
    DOCX: "bg-blue-50 text-blue-500 border border-blue-100",
    PPTX: "bg-orange-100 text-orange-600 border border-orange-200",
  }
  return (
    <span className={`font-body text-xs px-2 py-0.5 rounded
      font-medium ${colors[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  )
}

// ── Subject Badge ──────────────────────────────────────────
function SubjectBadge({ subject }) {
  const colors = {
    Chemistry: "text-green-600",
    Physics: "text-blue-600",
    Mathematics: "text-purple-600",
    Biology: "text-orange-500",
    English: "text-pink-500",
    History: "text-yellow-600",
  }
  return (
    <span className={`font-body text-xs font-semibold
      ${colors[subject] || "text-gray-600"}`}>
      {subject}
    </span>
  )
}

// ── Upload Modal ───────────────────────────────────────────
function UploadModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md
        shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-lg font-semibold text-[#0A1931]">
            Upload Material
          </h3>
          <Button variant="primary" icon={Upload}
            onClick={() => setShowUpload(true)}>
            Upload Material
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">
              Title
            </label>
            <input type="text" placeholder="Resource title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                font-body text-sm text-gray-700 focus:outline-none
                focus:border-[#4A7FA7]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-gray-500 mb-1 block">
                Subject
              </label>
              <select className="w-full border border-gray-200 rounded-lg
                px-3 py-2.5 font-body text-sm text-gray-700
                focus:outline-none focus:border-[#4A7FA7]">
                {subjects.filter(s => s !== "All Subjects").map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-gray-500 mb-1 block">
                Type
              </label>
              <select className="w-full border border-gray-200 rounded-lg
                px-3 py-2.5 font-body text-sm text-gray-700
                focus:outline-none focus:border-[#4A7FA7]">
                {typeOptions.filter(t => t !== "All Types").map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">
              File
            </label>
            <div className="border-2 border-dashed border-gray-200
              rounded-lg p-6 text-center hover:border-[#4A7FA7]
              transition-colors cursor-pointer">
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-body text-xs text-gray-400">
                Click to upload or drag & drop
              </p>
              <p className="font-body text-xs text-gray-300 mt-1">
                PDF, DOCX, PPTX, MP4 up to 500MB
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth>
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
function ResourcesPage() {
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState("All Types")
  const [selectedMentor, setSelectedMentor] = useState("All Mentors")
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")
  const [sortBy, setSortBy] = useState("Newest First")
  const [showUpload, setShowUpload] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  return (
    <div className="space-y-5">

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
            Study Materials
          </h2>
          <p className="font-body text-sm text-gray-400 mt-1">
            Browse, download and search resources uploaded by your mentors
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-[#1A3D63] text-white
            font-body text-sm font-medium px-4 py-2.5 rounded-lg
            hover:bg-[#4A7FA7] transition-colors duration-200"
        >
          <Upload size={16} />
          Upload Material
        </button>
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2
              -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search by title, subject or mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200
                rounded-lg font-body text-sm text-gray-600
                focus:outline-none focus:border-[#4A7FA7]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-600 focus:outline-none
              focus:border-[#4A7FA7]"
          >
            {typeOptions.map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {/* Mentor Filter */}
          <select
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-600 focus:outline-none
              focus:border-[#4A7FA7]"
          >
            {mentorOptions.map(m => (
              <option key={m}>{m}</option>
            ))}
          </select>

          {/* Search Button */}
          <Button variant="primary">Search</Button>

        </div>

        {/* Subject Tabs */}
        <div className="flex flex-wrap gap-2 mt-3">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`font-body text-xs px-3 py-1.5 rounded-full
                transition-colors duration-200 flex items-center gap-1.5
                ${selectedSubject === subject
                  ? "bg-[#1A3D63] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              {subject}
              {subjectCount[subject] && (
                <span className={`text-[10px] font-medium
                  ${selectedSubject === subject
                    ? "text-white/70" : "text-gray-400"}`}>
                  {subjectCount[subject]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resources Table ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-3
          border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">
              All Materials
            </h3>
            <span className="font-body text-xs text-gray-400">
              24 resources
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-gray-400">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5
                font-body text-xs text-gray-600 focus:outline-none"
            >
              {sortOptions.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["RESOURCE", "SUBJECT", "MENTOR", "TYPE", "UPLOADED", "SIZE", "ACTIONS"].map(h => (
                  <th key={h}
                    className="font-body text-[10px] font-semibold
                      text-gray-400 text-left px-5 py-3 tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resources.map((resource) => (
                <tr key={resource.id}
                  className="hover:bg-gray-50 transition-colors">

                  {/* Resource Title */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded
                        flex items-center justify-center flex-shrink-0">
                        📄
                      </div>
                      <span className="font-body text-sm text-[#0A1931]
                        font-medium">
                        {resource.title}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-5 py-3.5">
                    <SubjectBadge subject={resource.subject} />
                  </td>

                  {/* Mentor */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full
                        ${resource.mentorColor} flex items-center
                        justify-center text-white text-[10px] font-bold
                        flex-shrink-0`}>
                        {resource.mentorInitials}
                      </div>
                      <span className="font-body text-sm text-gray-600">
                        {resource.mentor}
                      </span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3.5">
                    <TypeBadge type={resource.type} />
                  </td>

                  {/* Uploaded */}
                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-gray-400">
                      {resource.uploaded}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-gray-400">
                      {resource.size}
                    </span>
                  </td>

                  {/* Actions */}
                  <Tooltip text="Preview">
                    <button className="p-1.5 text-gray-400
                                       hover:text-[#1A3D63] transition-colors">
                      <Eye size={15} />
                    </button>
                  </Tooltip>
                  <Tooltip text="Download">
                    <button className="p-1.5 text-gray-400
                                       hover:text-[#1A3D63] transition-colors">
                      <Download size={15} />
                    </button>
                  </Tooltip>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3
          border-t border-gray-100">
          <span className="font-body text-xs text-gray-400">
            Showing 1–8 of 24
          </span>
          <div className="flex items-center gap-1">
            <button className="font-body text-xs text-gray-400
              hover:text-[#1A3D63] px-2 py-1 transition-colors">
              ‹ Prev
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded font-body text-xs
                  transition-colors
                  ${currentPage === page
                    ? "bg-[#1A3D63] text-white"
                    : "text-gray-400 hover:bg-gray-100"
                  }`}
              >
                {page}
              </button>
            ))}
            <button className="font-body text-xs text-gray-400
              hover:text-[#1A3D63] px-2 py-1 transition-colors">
              Next ›
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ResourcesPage