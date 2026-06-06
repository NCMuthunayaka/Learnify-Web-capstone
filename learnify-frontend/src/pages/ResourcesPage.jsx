import { useState, useEffect } from "react"
import { Search, Upload, Download, Eye } from "lucide-react"
import Button from "../components/common/Button"
import Modal from "../components/common/Modal"
import Tooltip from "../components/common/Tooltip"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import { getResources, uploadResource, trackDownload } from "../api/resourcesApi"
import { getSubjects } from "../api/subjectsApi"

const typeOptions   = ["All Types", "PDF", "Video", "DOCX", "PPTX"]
const sortOptions   = ["Newest First", "Oldest First", "A–Z", "Z–A"]
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
      {type?.toUpperCase()}
    </span>
  )
}

// ── Upload Modal ───────────────────────────────────────────
function UploadModal({ onClose, onUploadSuccess, subjects }) {
  const [uploadData, setUploadData] = useState({
    title: "", subject_id: "", file_type_id: "",
    file_url: "", file_size_mb: "",
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState("")

  function handleChange(e) {
    setUploadData({ ...uploadData, [e.target.name]: e.target.value })
  }

  async function handleUpload() {
    setError("")
    if (!uploadData.title || !uploadData.subject_id ||
        !uploadData.file_type_id || !uploadData.file_url) {
      setError("Please fill in all required fields")
      return
    }
    try {
      setUploading(true)
      await uploadResource({
        title:        uploadData.title,
        subject_id:   parseInt(uploadData.subject_id),
        file_type_id: parseInt(uploadData.file_type_id),
        file_url:     uploadData.file_url,
        file_size_mb: parseFloat(uploadData.file_size_mb) || 0,
      })
      onUploadSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error?.message || "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Material" size="md">
      <div className="space-y-4">

        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">Title *</label>
          <input type="text" name="title" placeholder="Resource title"
            value={uploadData.title} onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">Subject *</label>
            <select name="subject_id" value={uploadData.subject_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7]">
              <option value="">Select subject</option>
              {/* Subjects fetched from DB — not hardcoded */}
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-gray-500 mb-1 block">File Type *</label>
            <select name="file_type_id" value={uploadData.file_type_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7]">
              <option value="">Select type</option>
              {Object.entries(fileTypeIdMap).map(([name, id]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">File URL *</label>
          <input type="text" name="file_url"
            placeholder="https://example.com/file.pdf"
            value={uploadData.file_url} onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7]" />
        </div>

        <div>
          <label className="font-body text-xs text-gray-500 mb-1 block">File Size (MB)</label>
          <input type="number" name="file_size_mb" placeholder="3.2"
            value={uploadData.file_size_mb} onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-700 focus:outline-none focus:border-[#4A7FA7]" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={uploading}>Cancel</Button>
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
  const [subjects, setSubjects]               = useState([])  // 👈 from DB
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState("")
  const [search, setSearch]                   = useState("")
  const [selectedType, setSelectedType]       = useState("All Types")
  const [selectedSubject, setSelectedSubject] = useState(null) // null = All
  const [sortBy, setSortBy]                   = useState("Newest First")
  const [showUpload, setShowUpload]           = useState(false)
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
      }
    }
    fetchSubjects()
  }, [])

  // ── Fetch resources ────────────────────────────────────
  async function fetchResources() {
    try {
      setLoading(true)
      setError("")

      const filters = {}
      if (search)          filters.search      = search
      if (selectedSubject) filters.subject_id  = selectedSubject
      if (selectedType !== "All Types") {
        filters.file_type_id = fileTypeIdMap[selectedType]
      }

      const response = await getResources(filters)
      setResources(response.data || [])
    } catch (err) {
      setError("Failed to load resources. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResources() }, [])

  // ── Handle download ────────────────────────────────────
  async function handleDownload(resource) {
    try {
      const response = await trackDownload(resource.id)
      window.open(response.data.file_url, "_blank")
    } catch (err) {
      console.error("Download failed:", err)
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

  return (
    <div className="space-y-5">

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={fetchResources}
          subjects={subjects}  // 👈 pass DB subjects to modal
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
        <ErrorMessage message={error} onRetry={fetchResources}
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
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5
              font-body text-sm text-gray-600 focus:outline-none focus:border-[#4A7FA7]">
            {typeOptions.map(t => <option key={t}>{t}</option>)}
          </select>
          <Button variant="primary" onClick={fetchResources}>Search</Button>
        </div>

        {/* Subject Tabs — from DB */}
        <div className="flex flex-wrap gap-2 mt-3">

          {/* All Subjects button */}
          <button
            onClick={() => { setSelectedSubject(null); setCurrentPage(1) }}
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

          {/* Dynamic subject tabs from DB */}
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => {
                setSelectedSubject(subject.id)
                setCurrentPage(1)
              }}
              className={`font-body text-xs px-3 py-1.5 rounded-full
                transition-colors duration-200
                ${selectedSubject === subject.id
                  ? "text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              style={selectedSubject === subject.id
                ? { backgroundColor: subject.color_hex }  // 👈 color from DB
                : {}}
            >
              {subject.name}  {/* 👈 name from DB */}
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
          <div className="text-center py-16">
            <p className="font-heading text-sm font-semibold text-gray-300">
              No resources found
            </p>
            <p className="font-body text-xs text-gray-200 mt-1">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["RESOURCE", "SUBJECT", "MENTOR", "TYPE",
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
                          📄
                        </div>
                        <span className="font-body text-sm text-[#0A1931] font-medium">
                          {resource.title}
                        </span>
                      </div>
                    </td>

                    {/* Subject — colored from DB */}
                    <td className="px-5 py-3.5">
                      <span
                        className="font-body text-xs font-semibold"
                        style={{ color: getSubjectColor(resource.subject_name) }}
                      >
                        {resource.subject_name}
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
                      <span className="font-body text-xs text-gray-400">
                        {new Date(resource.uploaded_at)
                          .toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs text-gray-400">
                        {resource.file_size_mb ? `${resource.file_size_mb} MB` : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Tooltip text="Preview">
                          <button
                            onClick={() => window.open(resource.file_url, "_blank")}
                            className="p-1.5 text-gray-400 hover:text-[#1A3D63] transition-colors">
                            <Eye size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Download">
                          <button
                            onClick={() => handleDownload(resource)}
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
    </div>
  )
}

export default ResourcesPage