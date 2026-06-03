import { useState } from "react"
import { Upload, Download, Eye, Trash2, Edit, X, Plus } from "lucide-react"

// ── Data ──────────────────────────────────────────────────
const myResources = [
  { id: 1, title: "Organic Chemistry — Reaction Mechanisms",   subject: "Chemistry",   type: "PDF",   uploaded: "28 Apr 2026", size: "3.2 MB",  downloads: 45, views: 120 },
  { id: 2, title: "Electrochemistry — Full Notes & MCQ Bank",  subject: "Chemistry",   type: "PDF",   uploaded: "18 Apr 2026", size: "12.4 MB", downloads: 38, views: 95  },
  { id: 3, title: "Wave Interference & Diffraction",           subject: "Physics",     type: "PDF",   uploaded: "25 Apr 2026", size: "5.8 MB",  downloads: 52, views: 140 },
  { id: 4, title: "Mechanics — Newton's Laws Video Lesson",    subject: "Physics",     type: "Video", uploaded: "17 Apr 2026", size: "220 MB",  downloads: 67, views: 210 },
]

const statsData = [
  { label: "Total Uploads",    value: "24",   icon: "📁" },
  { label: "Total Downloads",  value: "1.2k", icon: "⬇️" },
  { label: "Total Views",      value: "3.4k", icon: "👁️" },
  { label: "Students Reached", value: "89",   icon: "👥" },
]

// ── Type Badge ─────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = {
    PDF:   "bg-red-100 text-red-600",
    Video: "bg-blue-100 text-blue-600",
    DOCX:  "bg-blue-50 text-blue-500",
    PPTX:  "bg-orange-100 text-orange-600",
  }
  return (
    <span className={`font-body text-xs px-2 py-0.5 rounded
      font-medium ${colors[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
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
            Upload New Resource
          </h3>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">
              Title
            </label>
            <input type="text" placeholder="Resource title"
              className="w-full border border-gray-200 rounded-lg px-3
                py-2.5 font-body text-sm focus:outline-none
                focus:border-[#4A7FA7]" />
          </div>

          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">
              Description
            </label>
            <textarea placeholder="Brief description..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3
                py-2.5 font-body text-sm focus:outline-none
                focus:border-[#4A7FA7] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-gray-500 mb-1 block">
                Subject
              </label>
              <select className="w-full border border-gray-200 rounded-lg
                px-3 py-2.5 font-body text-sm focus:outline-none
                focus:border-[#4A7FA7]">
                {["Chemistry", "Physics", "Mathematics", "Biology", "English"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-gray-500 mb-1 block">
                Visibility
              </label>
              <select className="w-full border border-gray-200 rounded-lg
                px-3 py-2.5 font-body text-sm focus:outline-none
                focus:border-[#4A7FA7]">
                <option>All Students</option>
                <option>My Students Only</option>
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
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-500
                font-body text-sm py-2.5 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button className="flex-1 bg-[#1A3D63] text-white
              font-body text-sm py-2.5 rounded-lg hover:bg-[#4A7FA7]
              transition-colors">
              Upload Resource
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
function MentorResourcesPage() {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="space-y-5">

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
            My Resources
          </h2>
          <p className="font-body text-sm text-gray-400 mt-1">
            Manage and track your uploaded study materials
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-[#1A3D63] text-white
            font-body text-sm font-medium px-4 py-2.5 rounded-lg
            hover:bg-[#4A7FA7] transition-colors"
        >
          <Plus size={16} />
          Upload Resource
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label}
            className="bg-white rounded-2xl px-5 py-4 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="font-body text-xs text-gray-400">{stat.label}</p>
            <p className="font-heading text-2xl font-bold text-[#0A1931] mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Resources Table ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-heading text-sm font-semibold text-[#0A1931]">
            Uploaded Resources
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["RESOURCE", "SUBJECT", "TYPE", "UPLOADED", "SIZE", "DOWNLOADS", "VIEWS", "ACTIONS"].map(h => (
                  <th key={h}
                    className="font-body text-[10px] font-semibold
                      text-gray-400 text-left px-5 py-3 tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myResources.map((resource) => (
                <tr key={resource.id}
                  className="hover:bg-gray-50 transition-colors">

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded
                        flex items-center justify-center">📄</div>
                      <span className="font-body text-sm text-[#0A1931]
                        font-medium">
                        {resource.title}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs font-semibold
                      text-[#4A7FA7]">
                      {resource.subject}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <TypeBadge type={resource.type} />
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-gray-400">
                      {resource.uploaded}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-gray-400">
                      {resource.size}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs font-medium
                      text-[#0A1931]">
                      {resource.downloads}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs font-medium
                      text-[#0A1931]">
                      {resource.views}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400
                        hover:text-[#1A3D63] transition-colors">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400
                        hover:text-[#1A3D63] transition-colors">
                        <Edit size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400
                        hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default MentorResourcesPage