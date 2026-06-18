import { useState, useEffect } from "react"
import { Upload, Download, Eye, Trash2, Edit, X, Plus } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import Tooltip from "../../components/common/Tooltip"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorMessage from "../../components/common/ErrorMessage"
import {
  getMyResources,
  getMyStats,
  uploadResource,
  deleteResource,
  updateResource,
} from "../../api/resourcesApi"
import { getSubjects } from "../../api/subjectsApi"

const fileTypeIdMap = { "PDF": 1, "DOCX": 2, "PPTX": 3, "Video": 4 }
const sortOptions   = ["Newest First", "Oldest First", "A–Z", "Z–A"]

// ── Type Badge ─────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = {
    pdf:  "bg-red-100 text-red-600",
    mp4:  "bg-blue-100 text-blue-600",
    docx: "bg-blue-50 text-blue-500",
    pptx: "bg-orange-100 text-orange-600",
  }
  return (
    <span className={`font-body text-xs px-2 py-0.5 rounded font-medium
      ${colors[type?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
      {type?.toUpperCase()}
    </span>
  )
}

// ── Upload Modal ───────────────────────────────────────────


function UploadModal({ onClose, onUploadSuccess, subjects }) {
  const [title, setTitle]           = useState("")
  const [subjectId, setSubjectId]   = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState("")
  const [error, setError]           = useState("")

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    // Check extension
    const ext     = file.name.split(".").pop().toLowerCase()
    const allowed = ["pdf", "docx", "pptx", "mp4"]
    if (!allowed.includes(ext)) {
      setError("Only PDF, DOCX, PPTX, and MP4 files are allowed")
      return
    }

    // Check size — max 100MB
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB")
      return
    }

    setSelectedFile(file)
    setError("")
  }

  async function handleUpload() {
    setError("")

    // Validate
    if (!title.trim()) {
      setError("Please enter a title")
      return
    }
    if (!subjectId) {
      setError("Please select a subject")
      return
    }
    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    try {
      setUploading(true)

      // Step 1 — Upload actual file to server
      setProgress("Uploading file to server...")
      const uploadRes  = await uploadFile(selectedFile)
      const fileUrl    = uploadRes.data.file_url
      const fileSizeMb = uploadRes.data.file_size_mb
      const fileTypeId = uploadRes.data.file_type_id

      // Step 2 — Save resource record in DB
      setProgress("Saving resource details...")
      await uploadResource({
        title:        title,
        subject_id:   parseInt(subjectId),
        file_type_id: fileTypeId,   // ✅ auto-detected from file
        file_url:     fileUrl,      // ✅ server path
        file_size_mb: fileSizeMb,   // ✅ auto-calculated
      })

      onUploadSuccess()
      onClose()

    } catch (err) {
      setError(err.response?.data?.error?.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      setProgress("")
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Material" size="md">
      <div className="space-y-4">

        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* Title */}
        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">
            Title *
          </label>
          <input
            type="text"
            placeholder="Resource title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-700 focus:outline-none
              focus:border-[#4A7FA7]"
          />
        </div>

        {/* Subject — from DB */}
        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">
            Subject *
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-700 focus:outline-none
              focus:border-[#4A7FA7]"
          >
            <option value="">Select subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* File Upload — real file picker ✅ */}
        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">
            File * — PDF, DOCX, PPTX, MP4 (max 100MB)
          </label>
          <div
            onClick={() => document.getElementById("student-file-input").click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center
              cursor-pointer transition-colors
              ${selectedFile
                ? "border-[#4A7FA7] bg-blue-50"
                : "border-gray-200 hover:border-[#4A7FA7] hover:bg-gray-50"
              }`}
          >
            {selectedFile ? (
              <div className="space-y-1">
                {/* File icon based on type */}
                <p className="text-2xl">
                  {selectedFile.name.endsWith(".pdf")  ? "📄" :
                   selectedFile.name.endsWith(".mp4")  ? "🎬" :
                   selectedFile.name.endsWith(".pptx") ? "📊" : "📝"}
                </p>
                <p className="font-body text-sm font-medium text-[#1A3D63]">
                  {selectedFile.name}
                </p>
                <p className="font-body text-xs text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  {" · "}
                  {selectedFile.name.split(".").pop().toUpperCase()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="font-body text-xs text-red-400
                    hover:text-red-600 transition-colors mt-1"
                >
                  ✕ Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl">📁</p>
                <p className="font-body text-sm text-gray-500 font-medium">
                  Click to select a file
                </p>
                <p className="font-body text-xs text-gray-300">
                  PDF, DOCX, PPTX, MP4
                </p>
              </div>
            )}
          </div>
          <input
            id="student-file-input"
            type="file"
            accept=".pdf,.docx,.pptx,.mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {progress && (
          <div className="flex items-center gap-2 bg-blue-50
            rounded-lg px-4 py-3">
            <div className="w-4 h-4 border-2 border-[#4A7FA7]
              border-t-transparent rounded-full animate-spin
              flex-shrink-0" />
            <p className="font-body text-xs text-[#1A3D63]">{progress}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth
            onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth
            onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>

      </div>
    </Modal>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────
function DeleteModal({ onClose, onConfirm, title }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Delete Resource" size="sm">
      <div className="space-y-4">
        <p className="font-body text-sm text-gray-600">
          Are you sure you want to delete <strong>{title}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────
function MentorResourcesPage() {
  const [resources, setResources]     = useState([])
  const [subjects, setSubjects]       = useState([])
  const [stats, setStats]             = useState({
    total_uploads: 0, total_downloads: 0, total_views: 0
  })
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [showUpload, setShowUpload]   = useState(false)
  const [editResource, setEditResource] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sortBy, setSortBy]           = useState("Newest First")

  // ── Fetch on load ──────────────────────────────────────
  useEffect(() => {
    fetchAll()
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    try {
      const response = await getSubjects()
      setSubjects(response.data || [])
    } catch (err) {
      console.error("Failed to load subjects:", err)
    }
  }

  async function fetchAll() {
    try {
      setLoading(true)
      setError("")

      const [resourcesRes, statsRes] = await Promise.all([
        getMyResources(),
        getMyStats(),
      ])

      setResources(resourcesRes.data || [])
      setStats(statsRes.data || {
        total_uploads: 0, total_downloads: 0, total_views: 0
      })

    } catch (err) {
      setError("Failed to load resources. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Delete resource ────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteResource(deleteTarget.id)
      setDeleteTarget(null)
      fetchAll()
    } catch (err) {
      setError("Failed to delete resource.")
    }
  }

  // ── Stats data ─────────────────────────────────────────
  const statsData = [
    { label: "Total Uploads",    value: stats.total_uploads,   icon: "📁" },
    { label: "Total Downloads",  value: stats.total_downloads, icon: "⬇️" },
    { label: "Total Views",      value: stats.total_views,     icon: "👁️" },
  ]

  return (
    <div className="space-y-5">

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={fetchAll}
          subjects={subjects}
        />
      )}
      {editResource && (
        <UploadModal
          onClose={() => setEditResource(null)}
          onSuccess={fetchAll}
          subjects={subjects}
          editResource={editResource}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={deleteTarget.title}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
            My Resources
          </h2>
          <p className="font-body text-sm text-gray-400 mt-1">
            Manage and track your uploaded study materials
          </p>
        </div>
        <Button variant="primary" icon={Plus}
          onClick={() => setShowUpload(true)}>
          Upload Resource
        </Button>
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onRetry={fetchAll}
          onDismiss={() => setError("")} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label}
            className="bg-white rounded-2xl px-5 py-4 shadow-sm
              border border-gray-100">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="font-body text-xs text-gray-400">{stat.label}</p>
            <p className="font-heading text-2xl font-bold text-[#0A1931] mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <div className="flex items-center justify-between px-5 py-3
          border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">
              Uploaded Resources
            </h3>
            <span className="font-body text-xs text-gray-400">
              {resources.length} resources
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-gray-400">Sort by</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5
                font-body text-xs text-gray-600 focus:outline-none">
              {sortOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" label="Loading resources..." />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-sm font-semibold text-gray-300">
              No resources uploaded yet
            </p>
            <p className="font-body text-xs text-gray-200 mt-1">
              Click "Upload Resource" to add your first resource
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["RESOURCE", "SUBJECT", "TYPE", "UPLOADED",
                    "SIZE", "DOWNLOADS", "VIEWS", "ACTIONS"].map(h => (
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
                        {resource.subject_name || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <TypeBadge type={resource.file_type_name} />
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs text-gray-400">
                        {new Date(resource.uploaded_at)
                          .toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs text-gray-400">
                        {resource.file_size_mb
                          ? `${resource.file_size_mb} MB` : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs font-medium
                        text-[#0A1931]">
                        {resource.download_count || 0}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs font-medium
                        text-[#0A1931]">
                        {resource.view_count || 0}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Tooltip text="Preview">
                          <button
                            onClick={() => window.open(resource.file_url, "_blank")}
                            className="p-1.5 text-gray-400
                              hover:text-[#1A3D63] transition-colors">
                            <Eye size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Edit">
                          <button
                            onClick={() => setEditResource(resource)}
                            className="p-1.5 text-gray-400
                              hover:text-[#1A3D63] transition-colors">
                            <Edit size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Delete">
                          <button
                            onClick={() => setDeleteTarget(resource)}
                            className="p-1.5 text-gray-400
                              hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default MentorResourcesPage