import { useState, useEffect } from "react"
import { Search, Upload, Download, Eye, FileText } from "lucide-react"
import Button from "../components/common/Button"
import Modal from "../components/common/Modal"
import Tooltip from "../components/common/Tooltip"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import {
  getResources,
  uploadResource,
  uploadFile,
  trackDownload,
  rateResource,
} from "../api/resourcesApi"
import { getSubjects, createSubject } from "../api/subjectsApi"
import { getStudentsList } from "../api/usersApi"
import { shareResource } from "../api/resourcesApi"
import MaterialPreviewModal from "../components/resources/MaterialPreviewModal"
import StarRating from "../components/common/StarRating"

const typeOptions   = ["All Types", "PDF", "Video", "DOCX", "PPTX"]
const sortOptions   = ["Newest First", "Highest Rated", "Oldest First", "A–Z", "Z–A"]
const fileTypeIdMap = { "PDF": 1, "DOCX": 2, "PPTX": 3, "Video": 4 }

// ── Type Badge ─────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = {
    pdf:  "bg-red-100 text-red-600 border border-red-200",
    mp4:  "bg-blue-100 text-blue-600 border border-blue-200",
    docx: "bg-blue-50 text-blue-500 border border-blue-100",
    pptx: "bg-orange-100 text-orange-600 border border-orange-200",
  }
  return (
    <span className={`font-body text-xs px-2 py-0.5 rounded font-medium
      ${colors[type?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
      {type?.toUpperCase() || "—"}
    </span>
  )
}

// ── Upload Modal — real file picker ─────────────────────────
function UploadModal({ onClose, onUploadSuccess, subjects }) {
  const [title, setTitle]               = useState("")
  const [subjectId, setSubjectId]       = useState("")
  const [customSubject, setCustomSubject] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [progress, setProgress]         = useState("")
  const [error, setError]               = useState("")
  const [isPublic, setIsPublic]         = useState(true)
  const [students, setStudents]         = useState([])
  const [selectedStudent, setSelectedStudent] = useState("")

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

    const ext     = file.name.split(".").pop().toLowerCase()
    const allowed = ["pdf", "docx", "pptx", "mp4"]
    if (!allowed.includes(ext)) {
      setError("Only PDF, DOCX, PPTX, and MP4 files are allowed")
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB")
      return
    }
    setSelectedFile(file)
    setError("")
  }

  async function handleUpload() {
    setError("")

    if (!title.trim()) { setError("Please enter a title"); return }
    if (!subjectId)    { setError("Please select a subject"); return }
    if (subjectId === "NEW_CUSTOM_SUBJECT" && !customSubject.trim()) {
      setError("Please type the new subject name")
      return
    }
    if (!selectedFile) { setError("Please select a file"); return }
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

      // Step 1 — upload file
      setProgress("Uploading file...")
      const step1 = await uploadFile(selectedFile)

      // Step 2 — save record
      setProgress("Saving resource...")
      await uploadResource({
        title:        title,
        subject_id:   parseInt(finalSubjectId),
        file_type_id: step1.data.file_type_id,
        file_url:     step1.data.file_url,
        file_size_mb: step1.data.file_size_mb,
        is_public:    isPublic,
        recipient_id: selectedStudent ? parseInt(selectedStudent) : null
      })

      onUploadSuccess()
      onClose()

    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Upload failed. Please try again."
      )
    } finally {
      setUploading(false)
      setProgress("")
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Material" size="md">
      <div className="space-y-4">

        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

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

        {/* Subject */}
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

        {/* File Picker */}
        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">
            File * — PDF, DOCX, PPTX, MP4 (max 100MB)
          </label>
          <div
            onClick={() => document.getElementById("resource-file-input").click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center
              cursor-pointer transition-colors
              ${selectedFile
                ? "border-[#4A7FA7] bg-blue-50"
                : "border-gray-200 hover:border-[#4A7FA7] hover:bg-gray-50"
              }`}
          >
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-2xl">
                  {selectedFile.name.endsWith(".pdf")  ? "📄" :
                   selectedFile.name.endsWith(".mp4")  ? "🎬" :
                   selectedFile.name.endsWith(".pptx") ? "📊" : "📝"}
                </p>
                <p className="font-body text-sm font-medium text-[#1A3D63]">
                  {selectedFile.name}
                </p>
                <p className="font-body text-xs text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                  {selectedFile.name.split(".").pop().toUpperCase()}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                  className="font-body text-xs text-red-400 hover:text-red-600
                    transition-colors mt-1"
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
            id="resource-file-input"
            type="file"
            accept=".pdf,.docx,.pptx,.mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Progress */}
        {progress && (
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-3">
            <div className="w-4 h-4 border-2 border-[#4A7FA7]
              border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="font-body text-xs text-[#1A3D63]">{progress}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>

      </div>
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────
function ResourcesPage() {
  const [resources, setResources]             = useState([])
  const [subjects, setSubjects]               = useState([])
  const [subjectsLoaded, setSubjectsLoaded]   = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [searching, setSearching]             = useState(false) // subtle re-fetch indicator
  const [error, setError]                     = useState("")
  const [search, setSearch]                   = useState("")
  const [selectedType, setSelectedType]       = useState("All Types")
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [sortBy, setSortBy]                   = useState("Newest First")
  const [showUpload, setShowUpload]           = useState(false)
  const [previewResource, setPreviewResource]  = useState(null)
  const [currentPage, setCurrentPage]         = useState(1)
  const itemsPerPage = 8

  // ── Fetch subjects from DB on load ─────────────────────
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const response = await getSubjects()
        setSubjects(response.data || [])
      } catch (err) {
        console.error("Failed to load subjects:", err)
      } finally {
        setSubjectsLoaded(true)
      }
    }
    fetchSubjects()
  }, [])

  // ── Fetch resources ────────────────────────────────────
  async function fetchResources({ isInitial = false } = {}) {
    try {
      isInitial ? setLoading(true) : setSearching(true)
      setError("")

      const filters = {}
      if (search)          filters.search      = search
      if (selectedSubject) filters.subject_id  = selectedSubject
      if (selectedType !== "All Types") {
        filters.file_type_id = fileTypeIdMap[selectedType]
      }

      const response = await getResources(filters)
      let data = response.data || []

      // ── Apply sorting ─────────────────────────────────
      data = sortResources(data, sortBy)

      setResources(data)
      setCurrentPage(1) // reset to page 1 whenever filters change

    } catch (err) {
      setError("Failed to load resources. Please try again.")
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  useEffect(() => {
    fetchResources({ isInitial: true })
  }, [])

  // ── Re-fetch when subject/type/sort change ─────────────
  useEffect(() => {
    if (!subjectsLoaded) return // skip first mount race
    fetchResources()
  }, [selectedSubject, selectedType, sortBy])

  // ── Sort helper ─────────────────────────────────────────
  function sortResources(data, sortKey) {
    const sorted = [...data]
    switch (sortKey) {
      case "Highest Rated":
        return sorted.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      case "Oldest First":
        return sorted.sort((a, b) =>
          new Date(a.uploaded_at) - new Date(b.uploaded_at))
      case "A–Z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case "Z–A":
        return sorted.sort((a, b) => b.title.localeCompare(a.title))
      case "Newest First":
      default:
        return sorted.sort((a, b) =>
          new Date(b.uploaded_at) - new Date(a.uploaded_at))
    }
  }

  // ── Handle rating submission ───────────────────────────
  async function handleInlineRate(resourceId, rating) {
    try {
      const res = await rateResource(resourceId, rating)
      if (res?.data) {
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId
              ? {
                  ...r,
                  avg_rating: res.data.avg_rating,
                  rating_count: res.data.rating_count,
                  user_rating: res.data.user_rating,
                }
              : r
          )
        )
      }
    } catch (err) {
      console.error("Failed to submit rating:", err)
    }
  }

  // ── Handle download ────────────────────────────────────
  function handleDownload(resource) {
    try {
      let downloadUrl = resource?.file_url
      if (downloadUrl) {
        if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
          const backendUrl =
            import.meta.env.VITE_BACKEND_URL ||
            import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
            "http://localhost:5000"
          const cleanBackendUrl = backendUrl.replace(/\/$/, "")
          const cleanUrl = downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`
          downloadUrl = `${cleanBackendUrl}${cleanUrl}`
        }
        if (!downloadUrl.includes("download=1")) {
          downloadUrl += (downloadUrl.includes("?") ? "&" : "?") + "download=1"
        }

        // Direct anchor download to bypass browser popup blocker
        const link = document.createElement("a")
        link.href = downloadUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        if (resource.title) {
          link.download = resource.title
        }
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Track download count in background without blocking execution
        if (resource.id) {
          trackDownload(resource.id).catch((err) =>
            console.error("Track download warning:", err)
          )
        }
      }
    } catch (err) {
      console.error("Download failed:", err)
      setError("Failed to download. Please try again.")
    }
  }

  // ── Get subject color from DB data ─────────────────────
  function getSubjectColor(subjectName) {
    const subject = subjects.find(s => s.name === subjectName)
    return subject?.color_hex || "#4A90D9"
  }

  // ── Pagination ─────────────────────────────────────────
  const totalPages  = Math.ceil(resources.length / itemsPerPage)
  const startIndex  = (currentPage - 1) * itemsPerPage
  const currentData = resources.slice(startIndex, startIndex + itemsPerPage)

  // ── Determine empty state type ─────────────────────────
  const hasActiveFilters =
    search || selectedSubject || selectedType !== "All Types"

  return (
    <div className="space-y-5">

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={() => fetchResources()}
          subjects={subjects}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#0A1931]">
            Study Materials
          </h2>
          <p className="font-body text-sm text-gray-400 mt-1">
            Browse, download and search resources uploaded by your mentors
          </p>
        </div>
        <Button variant="primary" icon={Upload} onClick={() => setShowUpload(true)}>
          Upload Material
        </Button>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => fetchResources({ isInitial: true })}
          onDismiss={() => setError("")} />
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2
              -translate-y-1/2 text-gray-300" />
            <input type="text"
              placeholder="Search by title, subject or mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchResources()}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200
                rounded-lg font-body text-sm text-gray-600
                focus:outline-none focus:border-[#4A7FA7]" />
            {/* Subtle searching indicator inside input */}
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2
                w-3.5 h-3.5 border-2 border-[#4A7FA7]
                border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-600 focus:outline-none focus:border-[#4A7FA7]">
            {typeOptions.map(t => <option key={t}>{t}</option>)}
          </select>
          <Button variant="primary" onClick={() => fetchResources()}>
            Search
          </Button>
        </div>

        {/* Subject Tabs — from DB */}
        <div className="flex flex-wrap gap-2 mt-3">

          <button
            onClick={() => setSelectedSubject(null)}
            className={`font-body text-xs px-3 py-1.5 rounded-full
              transition-colors duration-200
              ${!selectedSubject
                ? "text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            style={!selectedSubject
              ? { backgroundColor: "#1A3D63" }
              : {}}
          >
            All Subjects
          </button>

          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`font-body text-xs px-3 py-1.5 rounded-full
                transition-colors duration-200
                ${selectedSubject === subject.id
                  ? "text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              style={selectedSubject === subject.id
                ? { backgroundColor: subject.color_hex }
                : {}}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <div className="flex items-center justify-between px-5 py-3
          border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">
              All Materials
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" label="Loading resources..." />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex
              items-center justify-center mx-auto">
              <FileText size={20} className="text-gray-300" />
            </div>
            {hasActiveFilters ? (
              <>
                <p className="font-heading text-sm font-semibold text-gray-300">
                  No resources found
                </p>
                <p className="font-body text-xs text-gray-200 mt-1">
                  Try a different search or clear filters
                </p>
                <button
                  onClick={() => {
                    setSearch("")
                    setSelectedSubject(null)
                    setSelectedType("All Types")
                  }}
                  className="font-body text-xs text-[#4A7FA7]
                    hover:text-[#1A3D63] transition-colors font-medium mt-2"
                >
                  Clear all filters
                </button>
              </>
            ) : (
              <>
                <p className="font-heading text-sm font-semibold text-gray-300">
                  No study materials yet
                </p>
                <p className="font-body text-xs text-gray-200 mt-1">
                  Your mentors haven't uploaded any resources yet
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["RESOURCE", "SUBJECT", "MENTOR", "TYPE", "RATING",
                    "UPLOADED", "SIZE", "ACTIONS"].map(h => (
                    <th key={h}
                      className="font-body text-[10px] font-semibold
                        text-gray-400 text-left px-5 py-3 tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((resource) => (
                  <tr key={resource.id}
                    className="hover:bg-gray-50 transition-colors">

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded
                          flex items-center justify-center flex-shrink-0">
                          {resource.file_type_name?.toLowerCase() === "video" ? "🎬" :
                           resource.file_type_name?.toLowerCase() === "pptx" ? "📊" :
                           resource.file_type_name?.toLowerCase() === "docx" ? "📝" : "📄"}
                        </div>
                        <div className="flex flex-col">
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
                          {resource.is_shared_personally && (
                            <span className="font-body text-[9px] text-[#4A7FA7] font-bold mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                              📎 Shared Personally
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className="font-body text-xs font-semibold"
                        style={{ color: getSubjectColor(resource.subject_name) }}
                      >
                        {resource.subject_name || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-sm text-gray-600">
                        {resource.uploader_name || "—"}
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
                        interactive={true}
                        onRate={(newRating) => handleInlineRate(resource.id, newRating)}
                        size={13}
                      />
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs text-gray-400">
                        {resource.uploaded_at
                          ? new Date(resource.uploaded_at)
                              .toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric"
                              })
                          : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs text-gray-400">
                        {resource.file_size_mb
                          ? `${resource.file_size_mb} MB`
                          : "—"}
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
                            className="p-1.5 text-gray-400 hover:text-[#1A3D63] transition-colors">
                            <Eye size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Download">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDownload(resource)
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#1A3D63] transition-colors">
                            <Download size={15} />
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

        {/* Pagination */}
        {!loading && resources.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3
            border-t border-gray-100">
            <span className="font-body text-xs text-gray-400">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage,
                resources.length)} of {resources.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="font-body text-xs text-gray-400 hover:text-[#1A3D63]
                  px-2 py-1 transition-colors disabled:opacity-30">
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded font-body text-xs transition-colors
                    ${currentPage === page
                      ? "bg-[#1A3D63] text-white"
                      : "text-gray-400 hover:bg-gray-100"}`}>
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="font-body text-xs text-gray-400 hover:text-[#1A3D63]
                  px-2 py-1 transition-colors disabled:opacity-30">
                Next ›
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Material Preview Modal */}
      <MaterialPreviewModal
        resource={previewResource}
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownload}
      />
    </div>
  )
}

export default ResourcesPage  