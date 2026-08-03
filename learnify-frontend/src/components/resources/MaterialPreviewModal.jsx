import React, { useState, useEffect, useCallback } from "react"
import {
  X, ExternalLink, Download, Eye, FileText, Film,
  Image as ImageIcon, Music, User, Calendar,
  HardDrive, BookOpen, AlertTriangle, Loader2
} from "lucide-react"
import { getResource, trackDownload, rateResource } from "../../api/resourcesApi"
import StarRating from "../common/StarRating"

// ── Helpers ─────────────────────────────────────────────────
const buildFullUrl = (url) => {
  if (!url || typeof url !== "string") return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const rawBackend =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  const cleanBackend = rawBackend.replace(/\/api\/?$/, "").replace(/\/$/, "")
  const cleanPath = url.startsWith("/") ? url : `/${url}`
  return `${cleanBackend}${cleanPath}`
}

const getExtension = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return ""
  const parts = fileUrl.split("?")[0].split(".")
  return parts.length > 1 ? parts.pop().toLowerCase() : ""
}

const STATUS = { IDLE: "idle", CHECKING: "checking", OK: "ok", NOT_FOUND: "not_found" }

// ── Main Component ───────────────────────────────────────────
function MaterialPreviewModal({ resource, isOpen, onClose, onDownload }) {
  const [detailedResource, setDetailedResource] = useState(null)
  const [textContent, setTextContent]           = useState(null)
  const [loadingText, setLoadingText]           = useState(false)
  const [fileStatus, setFileStatus]             = useState(STATUS.IDLE)
  const [docPreviewFailed, setDocPreviewFailed] = useState(false)
  const [iframeKey, setIframeKey]               = useState(0)
  const [blobUrl, setBlobUrl]                   = useState(null)
  const [loadingBlob, setLoadingBlob]           = useState(false)

  const currentResource = detailedResource || resource || {}
  const fullUrl = buildFullUrl(currentResource?.file_url)
  const ext     = getExtension(currentResource?.file_url)
  const typeName = typeof currentResource?.file_type_name === "string"
    ? currentResource.file_type_name.toLowerCase() : ""

  const isPdf   = ext === "pdf"  || typeName === "pdf"
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) || typeName === "image"
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext) || typeName === "video"
  const isAudio = ["mp3", "wav", "m4a"].includes(ext) || typeName === "audio"
  const isText  = ["txt", "md", "json", "js", "py", "csv", "html", "css"].includes(ext)
  const isDoc   = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext) ||
                  typeName === "docx" || typeName === "pptx"

  // True when server is not publicly reachable by Google Docs Viewer
  const isLocalhost = fullUrl.includes("localhost") || fullUrl.includes("127.0.0.1")
  const googleViewerUrl = (!isLocalhost && fullUrl)
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
    : null

  // ── Auth-aware file availability check ───────────────────
  const checkFile = useCallback(async (url) => {
    if (!url) { setFileStatus(STATUS.IDLE); return }
    setFileStatus(STATUS.CHECKING)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(url, {
        method: "HEAD",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setFileStatus(res.status === 404 ? STATUS.NOT_FOUND : STATUS.OK)
    } catch {
      // CORS / network error — try to show preview optimistically
      setFileStatus(STATUS.OK)
    }
  }, [])

  // ── Fetch full resource details when modal opens ──────────
  useEffect(() => {
    if (isOpen && resource?.id) {
      setDetailedResource(resource)
      setDocPreviewFailed(false)
      setBlobUrl(null)
      getResource(resource.id)
        .then((res) => { if (res?.data) setDetailedResource(res.data) })
        .catch((err) => console.error("Error fetching resource details:", err))
    } else {
      setDetailedResource(null)
      setTextContent(null)
      setFileStatus(STATUS.IDLE)
      setDocPreviewFailed(false)
      if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null) }
    }
  }, [isOpen, resource?.id])

  // ── Re-check file when URL becomes available ─────────────
  useEffect(() => {
    if (isOpen && fullUrl) checkFile(fullUrl)
  }, [isOpen, fullUrl, checkFile])

  // ── Fetch file as blob for preview (handles CORS/auth) ───
  useEffect(() => {
    if (!isOpen || !fullUrl || isDoc || isText) return
    // Only fetch blob for PDF, video, image, audio
    if (!isPdf && !isVideo && !isImage && !isAudio) return
    let cancelled = false
    setLoadingBlob(true)
    const token = localStorage.getItem("access_token")
    fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (!cancelled) {
          const url = URL.createObjectURL(blob)
          setBlobUrl(url)
          setFileStatus(STATUS.OK)
        }
      })
      .catch((err) => {
        console.error("Blob fetch failed, falling back to direct URL:", err)
        if (!cancelled) setFileStatus(STATUS.OK) // optimistic fallback
      })
      .finally(() => { if (!cancelled) setLoadingBlob(false) })
    return () => { cancelled = true }
  }, [isOpen, fullUrl, isPdf, isVideo, isImage, isAudio, isDoc, isText])

  // ── Clean up blob URL on unmount ──────────────────────────
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [blobUrl])

  // ── Fetch text content for text files ────────────────────
  useEffect(() => {
    if (!isOpen || !isText || !fullUrl) return
    setLoadingText(true)
    const token = localStorage.getItem("access_token")
    fetch(fullUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.text())
      .then((text) => { setTextContent(text); setLoadingText(false) })
      .catch(() => { setTextContent("Unable to load text file preview."); setLoadingText(false) })
  }, [isOpen, isText, fullUrl])

  // ── Keyboard / scroll lock ────────────────────────────────
  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape" && typeof onClose === "function") onClose() }
    if (isOpen) { window.addEventListener("keydown", onEsc); document.body.style.overflow = "hidden" }
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = "auto" }
  }, [isOpen, onClose])

  if (!isOpen || !resource) return null

  // ── Event handlers ────────────────────────────────────────
  const handleClose = (e) => {
    e?.preventDefault(); e?.stopPropagation()
    if (typeof onClose === "function") onClose()
  }
  const handleOpenTab = async (e) => {
    e?.preventDefault(); e?.stopPropagation()
    if (!fullUrl) return
    if (blobUrl) {
      window.open(blobUrl, "_blank")
      return
    }
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank")
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return
      }
    } catch (err) {
      console.error("Open in tab fetch error:", err)
    }
    window.open(fullUrl, "_blank", "noopener,noreferrer")
  }
  const handleDownloadClick = async (e) => {
    e?.preventDefault(); e?.stopPropagation()
    if (onDownload) { onDownload(currentResource); return }
    if (!fullUrl) return
    try {
      let targetUrl = fullUrl
      if (!targetUrl.includes("download=1"))
        targetUrl += (targetUrl.includes("?") ? "&" : "?") + "download=1"

      // Fetch file as blob with auth token to avoid browser error windows
      const token = localStorage.getItem("access_token")
      const response = await fetch(targetUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const ext = getExtension(currentResource?.file_url) || ""
      const title = currentResource?.title || "download"
      const fileName = title.includes(".") ? title : `${title}.${ext}`

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link); link.click(); document.body.removeChild(link)

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

      if (currentResource?.id)
        trackDownload(currentResource.id).catch((err) => console.error("Track download warning:", err))
    } catch (err) {
      console.error("Download failed:", err)
    }
  }
  const handleRate = async (newRating) => {
    if (!currentResource?.id) return
    try {
      const res = await rateResource(currentResource.id, newRating)
      if (res?.data)
        setDetailedResource((prev) => ({
          ...(prev || currentResource),
          avg_rating: res.data.avg_rating,
          rating_count: res.data.rating_count,
          user_rating: res.data.user_rating,
        }))
    } catch (err) { console.error("Failed to rate resource:", err) }
  }
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    } catch { return "" }
  }

  // ── Preview renderer ──────────────────────────────────────
  const previewUrl = blobUrl || fullUrl // prefer blob, fallback to direct

  const renderPreview = () => {
    // Loading check
    if (fileStatus === STATUS.CHECKING || loadingBlob) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <Loader2 size={32} className="animate-spin text-[#4A7FA7]" />
          <p className="font-body text-sm">{loadingBlob ? "Loading preview..." : "Checking file availability..."}</p>
        </div>
      )
    }

    // File not found
    if (fileStatus === STATUS.NOT_FOUND) {
      return (
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-3">
            <AlertTriangle size={28} />
          </div>
          <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">File Not Found on Server</h4>
          <p className="text-xs text-slate-500 mb-6">
            The file for &ldquo;{currentResource?.title || "this resource"}&rdquo; could not be located.
            It may have been moved or deleted.
          </p>
          <button type="button" onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors">
            Close Preview
          </button>
        </div>
      )
    }

    // PDF
    if (isPdf) {
      return (
        <div className="w-full h-[65vh] flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <iframe
            key={iframeKey}
            src={`${previewUrl}#toolbar=1&navpanes=0`}
            className="w-full flex-1 border-none"
            title={currentResource.title || "PDF Preview"}
          />
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
            <p className="font-body text-xs text-slate-400">If the PDF doesn&apos;t load, use Open in Tab or Download.</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleOpenTab}
                className="text-xs text-[#4A7FA7] hover:text-[#1A3D63] font-medium transition-colors">Open in Tab</button>
              <button type="button" onClick={handleDownloadClick}
                className="text-xs text-[#4A7FA7] hover:text-[#1A3D63] font-medium transition-colors">Download</button>
            </div>
          </div>
        </div>
      )
    }

    // Image
    if (isImage) {
      return (
        <div className="flex items-center justify-center w-full h-full max-h-[65vh] bg-white rounded-xl p-4 shadow-sm border border-slate-200 overflow-hidden">
          <img src={previewUrl} alt={currentResource.title || "Image Material"}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm" />
        </div>
      )
    }

    // Video
    if (isVideo) {
      return (
        <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
          <video src={previewUrl} controls autoPlay={false} className="w-full max-h-[65vh]">
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Audio
    if (isAudio) {
      return (
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1A3D63] mx-auto flex items-center justify-center mb-4">
            <Music size={32} />
          </div>
          <h4 className="font-heading font-semibold text-slate-800 text-base mb-4">
            {currentResource.title || "Audio Material"}
          </h4>
          <audio src={previewUrl} controls className="w-full">Your browser does not support the audio element.</audio>
        </div>
      )
    }

    // Text
    if (isText) {
      return (
        <div className="w-full h-[60vh] bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-auto font-mono text-xs text-slate-800 leading-relaxed">
          {loadingText ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading text content...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">{textContent}</pre>
          )}
        </div>
      )
    }

    // DOCX / PPTX / Office docs
    if (isDoc) {
      // Local server — Google Docs Viewer cannot reach localhost files
      if (isLocalhost || docPreviewFailed || !googleViewerUrl) {
        return (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#1A3D63] mb-3">
              <FileText size={28} />
            </div>
            <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">
              {currentResource.title || "Document"}
            </h4>
            <p className="text-xs text-slate-500 mb-2">
              {isLocalhost
                ? "In-browser preview is unavailable for documents on a local server."
                : "The document viewer could not load this file. It may not be publicly accessible."}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Please download or open the file directly to view it.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={handleOpenTab}
                className="px-4 py-2 text-xs font-semibold text-[#1A3D63] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                Open in New Tab
              </button>
              <button type="button" onClick={handleDownloadClick}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors">
                Download File
              </button>
            </div>
          </div>
        )
      }

      // Remote server — use Google Docs Viewer
      return (
        <div className="w-full h-[65vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <iframe
            key={`doc-${iframeKey}`}
            src={googleViewerUrl}
            className="w-full flex-1 border-none"
            title={currentResource.title || "Document Preview"}
            onError={() => setDocPreviewFailed(true)}
          />
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
            <p className="font-body text-xs text-slate-400">
              Powered by Google Docs Viewer.{" "}
              <button type="button" onClick={() => { setIframeKey(k => k + 1) }}
                className="text-[#4A7FA7] underline">Retry</button>{" "}
              or download if blank.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDocPreviewFailed(true)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Preview failed?
              </button>
              <button type="button" onClick={handleDownloadClick}
                className="text-xs text-[#4A7FA7] hover:text-[#1A3D63] font-medium transition-colors">
                Download
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Unknown file type
    return (
      <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
          <FileText size={28} />
        </div>
        <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">
          {currentResource.title || "Study Material"}
        </h4>
        <p className="text-xs text-slate-500 mb-6">
          Preview is not available for this file type. Open or download to view its contents.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={handleOpenTab}
            className="px-4 py-2 text-xs font-semibold text-[#1A3D63] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            Open in New Tab
          </button>
          <button type="button" onClick={handleDownloadClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors">
            Download File
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col z-10 overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#1A3D63]/10 text-[#1A3D63] flex items-center justify-center flex-shrink-0 text-lg">
              {isVideo ? <Film size={20} /> : isImage ? <ImageIcon size={20} /> : isAudio ? <Music size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold text-[#0A1931] truncate">
                {currentResource.title || "Study Material Preview"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                {currentResource.subject_name && (
                  <span className="font-semibold text-[#4A7FA7] flex items-center gap-1">
                    <BookOpen size={12} /> {currentResource.subject_name}
                  </span>
                )}
                {currentResource.uploader_name && (
                  <span className="flex items-center gap-1"><User size={12} /> {currentResource.uploader_name}</span>
                )}
                {currentResource.file_size_mb && (
                  <span className="flex items-center gap-1"><HardDrive size={12} /> {currentResource.file_size_mb} MB</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button type="button" onClick={handleOpenTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-[#1A3D63] transition-colors shadow-sm">
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>
            <button type="button" onClick={handleDownloadClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors shadow-sm">
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button type="button" onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Body */}
        <div className="flex-1 overflow-auto bg-slate-900/5 p-4 sm:p-6 min-h-[400px] flex items-center justify-center">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Eye size={13} className="text-slate-400" />
              <span>{currentResource.view_count || 0} views</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Download size={13} className="text-slate-400" />
              <span>{currentResource.download_count || 0} downloads</span>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-3 py-1 rounded-xl">
            <span className="text-xs font-semibold text-slate-700">Rate material:</span>
            <StarRating
              rating={currentResource.avg_rating || 0}
              count={currentResource.rating_count || 0}
              userRating={currentResource.user_rating}
              interactive={true}
              onRate={handleRate}
              size={17}
              showLabel={true}
            />
            {currentResource.user_rating && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                Your rating: {currentResource.user_rating}★
              </span>
            )}
          </div>
          {currentResource.uploaded_at && formatDate(currentResource.uploaded_at) && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar size={12} />
              <span>{formatDate(currentResource.uploaded_at)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MaterialPreviewModal
