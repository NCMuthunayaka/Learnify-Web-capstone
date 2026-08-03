import React, { useState, useEffect, useCallback } from "react"
import {
  BookOpen, Star, AlertTriangle, Download, Eye,
  Search, Trash2, Filter, RefreshCw, CheckSquare,
  Square, ExternalLink, ArrowUpDown, Info, ShieldAlert,
  Loader2
} from "lucide-react"
import {
  getAdminResources,
  deleteAdminResource,
  deleteAdminResourcesBatch
} from "../../api/adminResourcesApi"
import { getSubjects } from "../../api/subjectsApi"
import MaterialPreviewModal from "../../components/resources/MaterialPreviewModal"
import StarRating from "../../components/common/StarRating"

function AdminResourcesPage() {
  const [resources, setResources]         = useState([])
  const [summary, setSummary]             = useState({
    total_resources: 0,
    bad_rating_count: 0,
    total_downloads: 0,
    total_views: 0,
    platform_avg: 0,
  })
  const [subjects, setSubjects]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [toastMessage, setToastMessage]   = useState(null)

  // Filters & Sorting
  const [search, setSearch]               = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [ratingFilter, setRatingFilter]   = useState("all") // all, bad, top, unrated
  const [sortBy, setSortBy]               = useState("rating_asc") // rating_asc, rating_desc, downloads, views, newest

  // Selection & Modals
  const [selectedIds, setSelectedIds]     = useState([])
  const [previewResource, setPreviewResource] = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null) // single delete resource object
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // Show Toast notification
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // ── Fetch Resources ────────────────────────────────────────
  const fetchResources = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        search,
        subject_id: selectedSubject || undefined,
        rating_filter: ratingFilter,
        sort_by: sortBy,
      }
      const res = await getAdminResources(params)
      if (res?.data) {
        setResources(res.data.resources || [])
        setSummary(res.data.summary || {})
      }
    } catch (err) {
      console.error("Failed to load admin resources:", err)
      setError("Failed to load study resources. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [search, selectedSubject, ratingFilter, sortBy])

  // Fetch subjects for filter dropdown
  useEffect(() => {
    getSubjects()
      .then((res) => {
        if (res?.data) setSubjects(res.data)
      })
      .catch((err) => console.error("Failed to fetch subjects:", err))
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // ── Handlers for Selection ─────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === resources.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(resources.map((r) => r.id))
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectBadRated = () => {
    const badIds = resources.filter((r) => r.rating_count > 0 && r.avg_rating < 3.0).map((r) => r.id)
    setSelectedIds(badIds)
  };

  // ── Single Delete ──────────────────────────────────────────
  const confirmSingleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminResource(deleteTarget.id)
      showToast(`Deleted resource "${deleteTarget.title}"`)
      setDeleteTarget(null)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id))
      fetchResources()
    } catch (err) {
      console.error("Delete failed:", err)
      setError("Failed to delete resource.")
    } finally {
      setDeleting(false)
    }
  }

  // ── Batch Delete ───────────────────────────────────────────
  const confirmBatchDelete = async () => {
    if (selectedIds.length === 0) return
    setDeleting(true)
    try {
      const res = await deleteAdminResourcesBatch(selectedIds)
      showToast(res?.message || `Successfully deleted ${selectedIds.length} resources`)
      setShowBatchDelete(false)
      setSelectedIds([])
      fetchResources()
    } catch (err) {
      console.error("Batch delete failed:", err)
      setError("Failed to delete selected resources.")
    } finally {
      setDeleting(false)
    }
  }

  // ── Format date ────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A1931] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#4A7FA7]/30 flex items-center gap-3 text-xs font-semibold animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0A1931] via-[#1A3D63] to-[#2C5E8A] p-6 rounded-3xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <BookOpen size={22} className="text-[#8FB9A8]" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight">
              Resource Management
            </h1>
          </div>
          <p className="font-body text-xs sm:text-sm text-slate-300 max-w-xl">
            Monitor, evaluate, and moderate study materials across the platform. Identify low-rated uploads and keep content quality high.
          </p>
        </div>
        <button
          onClick={fetchResources}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-semibold backdrop-blur-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Total Resources</p>
            <h3 className="text-2xl font-bold text-[#0A1931]">{summary.total_resources}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A3D63] flex items-center justify-center">
            <BookOpen size={24} />
          </div>
        </div>

        {/* Low Rated Resources Warning Card */}
        <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all ${
          summary.bad_rating_count > 0 ? "bg-amber-50/70 border-amber-200" : "bg-white border-slate-200"
        }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-semibold text-amber-800">Low Rated (&lt; 3.0★)</p>
              {summary.bad_rating_count > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-amber-900">{summary.bad_rating_count}</h3>
            <p className="text-[10px] text-amber-700 mt-0.5 font-medium">Requires Admin Review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Total Downloads</p>
            <h3 className="text-2xl font-bold text-[#0A1931]">{summary.total_downloads.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Download size={24} />
          </div>
        </div>

        {/* Platform Avg Rating */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Platform Avg Rating</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-[#0A1931]">{summary.platform_avg || "0.0"}</h3>
              <Star size={18} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Star size={24} />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content & Controls Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Rating System Informational Notice */}
        <div className="px-6 py-3 bg-[#0A1931]/5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-[#1A3D63]" />
            <span>
              <strong>Rating System:</strong> Standard 1-to-5 star model with arithmetic averaging. Materials rated under <strong>3.0★</strong> are highlighted for review.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRatingFilter("bad")
                setSortBy("rating_asc")
              }}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold transition-colors cursor-pointer"
            >
              ⚠️ Show Low Rated First ({summary.bad_rating_count})
            </button>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources by title, subject, or uploader..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4A7FA7] focus:bg-white transition-all"
              />
            </div>

            {/* Subject Dropdown & Sort Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Subject Filter */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#4A7FA7]"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-[#0A1931] focus:outline-none focus:border-[#4A7FA7]"
                >
                  <option value="rating_asc">⚠️ Rating: Lowest First (Bad First)</option>
                  <option value="rating_desc">⭐ Rating: Highest First</option>
                  <option value="downloads">⬇️ Most Downloaded</option>
                  <option value="views">👁️ Most Viewed</option>
                  <option value="newest">🕒 Newest Uploads</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rating Filter Tabs & Batch Selection Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
              <button
                onClick={() => setRatingFilter("all")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  ratingFilter === "all"
                    ? "bg-white text-[#0A1931] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Materials ({summary.total_resources})
              </button>
              <button
                onClick={() => {
                  setRatingFilter("bad")
                  setSortBy("rating_asc")
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ratingFilter === "bad"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-700 hover:bg-amber-100/80"
                }`}
              >
                <AlertTriangle size={13} />
                <span>Low Rated (&lt; 3.0★)</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  ratingFilter === "bad" ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900"
                }`}>
                  {summary.bad_rating_count}
                </span>
              </button>
              <button
                onClick={() => setRatingFilter("top")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  ratingFilter === "top"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top Rated (4.0+★)
              </button>
              <button
                onClick={() => setRatingFilter("unrated")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  ratingFilter === "unrated"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unrated
              </button>
            </div>

            {/* Batch Delete Controls */}
            <div className="flex items-center gap-2">
              {summary.bad_rating_count > 0 && (
                <button
                  onClick={handleSelectBadRated}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Select All Bad Rated
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowBatchDelete(true)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resources Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-[#4A7FA7]" />
              <p className="text-xs font-medium">Loading resource catalog...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen size={28} />
              </div>
              <h4 className="font-heading font-bold text-slate-700 text-base mb-1">
                No resources found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                No study materials match your search or rating filters. Try clearing your search or switching filter tabs.
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setSelectedSubject("")
                  setRatingFilter("all")
                }}
                className="px-4 py-2 bg-[#1A3D63] text-white rounded-xl text-xs font-semibold hover:bg-[#0A1931] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {selectedIds.length === resources.length && resources.length > 0 ? (
                        <CheckSquare size={16} className="text-[#4A7FA7]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Resource Details</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Uploader</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Stats</th>
                  <th className="py-3.5 px-4">Uploaded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {resources.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  const isBadRated = item.rating_count > 0 && item.avg_rating < 3.0

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBadRated ? "bg-amber-50/30" : ""
                      } ${isSelected ? "bg-blue-50/50" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[#4A7FA7]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Resource Title & Type Badge */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span
                            onClick={() => setPreviewResource(item)}
                            className="font-bold text-[#0A1931] hover:text-[#4A7FA7] cursor-pointer transition-colors line-clamp-1"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                              {item.file_type_name || "File"}
                            </span>
                            {item.file_size_mb && (
                              <span className="text-[10px] text-slate-400">
                                {item.file_size_mb} MB
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {item.subject_name || "General"}
                      </td>

                      {/* Uploader */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{item.uploader_name}</span>
                          <span className="text-[10px] text-slate-400">{item.uploader_email}</span>
                        </div>
                      </td>

                      {/* Star Rating & Bad Rating Indicator */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {item.rating_count === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No ratings yet</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <StarRating rating={item.avg_rating} count={item.rating_count} size={14} />
                            </div>
                          )}
                          {isBadRated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded w-fit">
                              <AlertTriangle size={10} /> Bad Rating
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Views & Downloads */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span title="Views" className="flex items-center gap-1">
                            <Eye size={12} className="text-slate-400" />
                            {item.view_count || 0}
                          </span>
                          <span title="Downloads" className="flex items-center gap-1 font-semibold text-slate-700">
                            <Download size={12} className="text-slate-400" />
                            {item.download_count || 0}
                          </span>
                        </div>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(item.uploaded_at)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewResource(item)}
                            title="Preview Material"
                            className="p-1.5 text-slate-400 hover:text-[#1A3D63] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Resource"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Single Resource Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-bold text-[#0A1931] text-base mb-1">
                Delete Study Resource?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Are you sure you want to delete <strong className="text-slate-800">&quot;{deleteTarget.title}&quot;</strong> uploaded by <span className="font-semibold text-slate-700">{deleteTarget.uploader_name}</span>?
              </p>
              {deleteTarget.rating_count > 0 && deleteTarget.avg_rating < 3.0 && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-left text-[11px] text-amber-800 font-medium">
                  ⚠️ This material currently has a low rating of <strong>{deleteTarget.avg_rating}★</strong> based on {deleteTarget.rating_count} student votes.
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSingleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-bold text-[#0A1931] text-base mb-1">
                Delete {selectedIds.length} Selected Resources?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action will permanently delete all <strong className="text-slate-800">{selectedIds.length} selected materials</strong> from the platform database and disk storage.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDelete(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : `Delete All ${selectedIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Preview Modal */}
      <MaterialPreviewModal
        resource={previewResource}
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  )
}

export default AdminResourcesPage
