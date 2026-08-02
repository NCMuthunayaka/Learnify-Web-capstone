import { useState, useEffect } from "react"
import { Upload, Download, Eye, Trash2, Edit, X, Plus, Share2 } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import Tooltip from "../../components/common/Tooltip"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorMessage from "../../components/common/ErrorMessage"
import {
  getMyResources,
  getMyStats,
  uploadResource,
  uploadFile,
  deleteResource,
  updateResource,
  shareResource,
} from "../../api/resourcesApi"
import { getSubjects, createSubject } from "../../api/subjectsApi"
import { getStudentsList } from "../../api/usersApi"
import MaterialPreviewModal from "../../components/resources/MaterialPreviewModal"
import StarRating from "../../components/common/StarRating"

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


function UploadModal({ onClose, onUploadSuccess, subjects, editResource = null }) {
  const isEditing = Boolean(editResource)

  const [title, setTitle]                 = useState(editResource?.title || "")
  const [subjectId, setSubjectId]         = useState(
    editResource?.subject_id?.toString() || editResource?.subject?.id?.toString() || ""
  )
  const [customSubject, setCustomSubject] = useState("")
  const [selectedFile, setSelectedFile]   = useState(null)
  const [uploading, setUploading]         = useState(false)
  const [progress, setProgress]           = useState("")
  const [error, setError]                 = useState("")
  const [isPublic, setIsPublic]           = useState(editResource?.is_public ?? true)
  const [students, setStudents]           = useState([])
  const [selectedStudent, setSelectedStudent] = useState(
    editResource?.recipient_id?.toString() || ""
  )

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await getStudentsList()
        setStudents(res.data || [])
      } catch (err) {
        console.error("Failed to load students list:", err)
      }
    }
    loadStudents()
  }, [])

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
    if (subjectId === "NEW_CUSTOM_SUBJECT" && !customSubject.trim()) {
      setError("Please type the new subject name")
      return
    }
    if (!isEditing && !selectedFile) {
      setError("Please select a file to upload")
      return
    }
    if (!isPublic && !selectedStudent) {
      setError("Please select a student to share this private resource with.")
      return
    }

    try {
      setUploading(true)

      let finalSubjectId = subjectId
      if (subjectId === "NEW_CUSTOM_SUBJECT") {
        setProgress("Creating new subject...")
        const newSubRes = await createSubject(customSubject.trim())
        finalSubjectId = newSubRes.data.id
      }

      let fileUrl = editResource?.file_url
      let fileSizeMb = editResource?.file_size_mb
      let fileTypeId = editResource?.file_type_id

      if (selectedFile) {
        // Step 1 — Upload actual file to server
        setProgress("Uploading file to server...")
        const uploadRes  = await uploadFile(selectedFile)
        fileUrl    = uploadRes.data.file_url
        fileSizeMb = uploadRes.data.file_size_mb
        fileTypeId = uploadRes.data.file_type_id
      }

      // Step 2 — Save/Update resource record in DB
      if (isEditing) {
        setProgress("Updating resource details...")
        await updateResource(editResource.id, {
          title:        title.trim(),
          subject_id:   parseInt(finalSubjectId),
          file_type_id: fileTypeId,
          file_url:     fileUrl,
          file_size_mb: fileSizeMb,
          is_public:    isPublic,
          recipient_id: selectedStudent ? parseInt(selectedStudent) : null
        })
      } else {
        setProgress("Saving resource details...")
        await uploadResource({
          title:        title.trim(),
          subject_id:   parseInt(finalSubjectId),
          file_type_id: fileTypeId,
          file_url:     fileUrl,
          file_size_mb: fileSizeMb,
          is_public:    isPublic,
          recipient_id: selectedStudent ? parseInt(selectedStudent) : null
        })
      }

      onUploadSuccess()
      onClose()

    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Operation failed. Please try again."
      )
    } finally {
      setUploading(false)
      setProgress("")
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit Material" : "Upload Material"} size="md">
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

        {/* Subject — from DB with Add Custom Subject Option */}
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
            <option value="NEW_CUSTOM_SUBJECT">➕ Add New Subject...</option>
          </select>

          {subjectId === "NEW_CUSTOM_SUBJECT" && (
            <input
              type="text"
              placeholder="Type new subject name (e.g. Artificial Intelligence)"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2.5 font-body text-xs text-gray-700 focus:outline-none focus:border-[#4A7FA7] bg-blue-50/40"
            />
          )}
        </div>

        {/* Visibility toggle & target student share */}
        <div className="space-y-3.5 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-body text-xs font-bold text-[#0A1931] block">Make Resource Public</span>
              <span className="font-body text-[10px] text-gray-400">
                {isPublic 
                  ? "Visible in the general library for all students." 
                  : "Private: Only you and the selected student can view it."}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => {
                  setIsPublic(e.target.checked)
                  if (e.target.checked) setSelectedStudent("")
                }}
                className="sr-only peer" 
              />
              <div className="w-8 h-4.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#4A7FA7]"></div>
            </label>
          </div>

          <div className="pt-2.5 border-t border-gray-200/60">
            <label className="font-body text-xs text-gray-500 mb-1.5 block">
              {isPublic ? "Share with Student Personally (Optional)" : "Target Student (Required) *"}
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-xs text-gray-700 focus:outline-none focus:border-[#4A7FA7] bg-white"
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File Upload — real file picker */}
        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">
            File {isEditing ? "(Optional to replace existing file)" : "*"} — PDF, DOCX, PPTX, MP4 (max 100MB)
          </label>
          <div
            onClick={() => document.getElementById("mentor-resource-file-input").click()}
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
                  type="button"
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
            ) : isEditing ? (
              <div className="space-y-2">
                <p className="text-3xl">📄</p>
                <p className="font-body text-sm text-gray-600 font-medium">
                  Current file: {editResource.title} ({editResource.file_size_mb} MB)
                </p>
                <p className="font-body text-xs text-gray-400">
                  Click to replace with a new file (PDF, DOCX, PPTX, MP4)
                </p>
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
            id="mentor-resource-file-input"
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
            {uploading ? (isEditing ? "Updating..." : "Uploading...") : (isEditing ? "Update" : "Upload")}
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

// ── Share Modal ────────────────────────────────────────────
function ShareModal({ resource, onClose, onSuccess }) {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await getStudentsList()
        setStudents(res.data || [])
      } catch (err) {
        console.error("Failed to load students list:", err)
      }
    }
    loadStudents()
  }, [])

  async function handleShare() {
    if (!selectedStudent) {
      setError("Please select a student")
      return
    }

    try {
      setSharing(true)
      setError("")
      await shareResource(resource.id, parseInt(selectedStudent))
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to share resource")
    } finally {
      setSharing(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Share Study Material" size="sm">
      <div className="space-y-4">
        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}
        {success && (
          <div className="bg-green-50 text-green-700 p-3.5 rounded-2xl border border-green-100 text-xs font-semibold">
            🎉 Resource shared successfully!
          </div>
        )}

        <div>
          <p className="font-body text-xs text-gray-500 mb-2">
            Resource: <span className="font-bold text-[#0A1931]">{resource.title}</span>
          </p>
          <label className="font-body text-xs text-gray-500 mb-1.5 block">
            Select Student *
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={success}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-xs text-gray-700 focus:outline-none focus:border-[#4A7FA7] bg-white"
          >
            <option value="">-- Select Student --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={sharing || success}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleShare} disabled={sharing || success}>
            {sharing ? "Sharing..." : "Share"}
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
  const [shareTarget, setShareTarget]   = useState(null)
  const [previewResource, setPreviewResource] = useState(null)
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
          onUploadSuccess={() => { fetchAll(); fetchSubjects(); }}
          subjects={subjects}
        />
      )}
      {editResource && (
        <UploadModal
          onClose={() => setEditResource(null)}
          onUploadSuccess={() => { fetchAll(); fetchSubjects(); }}
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
      {shareTarget && (
        <ShareModal
          resource={shareTarget}
          onClose={() => setShareTarget(null)}
          onSuccess={() => {
            setShareTarget(null)
            fetchAll()
          }}
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
                  {["RESOURCE", "SUBJECT", "TYPE", "RATING", "UPLOADED",
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
                        <span
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setPreviewResource(resource)
                          }}
                          className="font-body text-sm text-[#0A1931] font-medium hover:text-[#4A7FA7] cursor-pointer transition-colors"
                        >
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
                      <StarRating
                        rating={resource.avg_rating || 0}
                        count={resource.rating_count || 0}
                        userRating={resource.user_rating}
                        interactive={false}
                        size={13}
                      />
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
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewResource(resource)
                            }}
                            className="p-1.5 text-gray-400
                              hover:text-[#1A3D63] transition-colors">
                            <Eye size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Share with Student">
                          <button
                            onClick={() => setShareTarget(resource)}
                            className="p-1.5 text-gray-400
                              hover:text-[#4A7FA7] transition-colors">
                            <Share2 size={15} />
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

      {/* Material Preview Modal */}
      <MaterialPreviewModal
        resource={previewResource}
        isOpen={!!previewResource}
        onClose={() => {
          setPreviewResource(null)
          fetchAll()
        }}
      />
    </div>
  )
}

export default MentorResourcesPage