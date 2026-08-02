import React, { useState, useEffect } from "react"
import { X, ExternalLink, Download, Eye, FileText, Film, Image as ImageIcon, Music, HelpCircle, User, Calendar, HardDrive, BookOpen, AlertTriangle } from "lucide-react"
import { getResource, trackDownload, rateResource } from "../../api/resourcesApi"
import StarRating from "../common/StarRating"

function MaterialPreviewModal({ resource, isOpen, onClose, onDownload }) {
  const [detailedResource, setDetailedResource] = useState(null)
  const [textContent, setTextContent] = useState(null)
  const [loadingText, setLoadingText] = useState(false)
  const [fileNotFound, setFileNotFound] = useState(false)

  // Determine full backend URL for relative paths
  const getFullUrl = (url) => {
    if (!url || typeof url !== "string") return ""
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5000"
    const cleanBackendUrl = backendUrl.replace(/\/$/, "")
    const cleanUrl = url.startsWith("/") ? url : `/${url}`
    return `${cleanBackendUrl}${cleanUrl}`
  }

  const currentResource = detailedResource || resource || {}
  const fullUrl = getFullUrl(currentResource?.file_url)

  // Check file availability on backend server
  useEffect(() => {
    if (isOpen && fullUrl) {
      setFileNotFound(false)
      fetch(fullUrl, { method: "HEAD" })
        .then((res) => {
          if (res.status === 404) {
            setFileNotFound(true)
          } else {
            setFileNotFound(false)
          }
        })
        .catch(() => {
          setFileNotFound(false)
        })
    } else {
      setFileNotFound(false)
    }
  }, [isOpen, fullUrl])

  // Track view & fetch latest details when modal opens
  useEffect(() => {
    if (isOpen && resource?.id) {
      setDetailedResource(resource)
      getResource(resource.id)
        .then((res) => {
          if (res?.data) {
            setDetailedResource(res.data)
          }
        })
        .catch((err) => {
          console.error("Error fetching resource details:", err)
        })
    } else {
      setDetailedResource(null)
      setTextContent(null)
    }
  }, [isOpen, resource?.id])

  // Get extension
  const getExtension = () => {
    if (!currentResource?.file_url || typeof currentResource.file_url !== "string") return ""
    const parts = currentResource.file_url.split("?")[0].split(".")
    return parts.length > 1 ? parts.pop().toLowerCase() : ""
  }

  const ext = getExtension()
  const typeName = typeof currentResource?.file_type_name === "string" ? currentResource.file_type_name.toLowerCase() : ""

  const isPdf = ext === "pdf" || typeName === "pdf"
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) || typeName === "image"
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(ext) || typeName === "video"
  const isAudio = ["mp3", "wav", "m4a"].includes(ext) || typeName === "audio"
  const isText = ["txt", "md", "json", "js", "py", "csv", "html", "css"].includes(ext)
  const isDoc = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext) || typeName === "docx" || typeName === "pptx"

  // Fetch plain text content if text file
  useEffect(() => {
    if (isOpen && isText && fullUrl) {
      setLoadingText(true)
      fetch(fullUrl)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text)
          setLoadingText(false)
        })
        .catch(() => {
          setTextContent("Unable to load text file preview.")
          setLoadingText(false)
        })
    }
  }, [isOpen, isText, fullUrl])

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && typeof onClose === "function") onClose()
    }
    if (isOpen) window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  // Prevent scrolling behind modal
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "auto"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen || !resource) return null

  const handleClose = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    if (typeof onClose === "function") onClose()
  }

  const handleOpenTab = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    if (fullUrl) {
      window.open(fullUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleDownloadClick = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()
    if (onDownload) {
      onDownload(currentResource)
      return
    }
    let targetUrl = fullUrl
    if (!targetUrl) return
    if (!targetUrl.includes("download=1")) {
      targetUrl += (targetUrl.includes("?") ? "&" : "?") + "download=1"
    }

    const link = document.createElement("a")
    link.href = targetUrl
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    if (currentResource?.title) {
      link.download = currentResource.title
    }
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (currentResource?.id) {
      trackDownload(currentResource.id).catch((err) =>
        console.error("Track download warning:", err)
      )
    }
  }

  const handleRate = async (newRating) => {
    if (!currentResource?.id) return
    try {
      const res = await rateResource(currentResource.id, newRating)
      if (res?.data) {
        setDetailedResource((prev) => ({
          ...(prev || currentResource),
          avg_rating: res.data.avg_rating,
          rating_count: res.data.rating_count,
          user_rating: res.data.user_rating,
        }))
      }
    } catch (err) {
      console.error("Failed to rate resource:", err)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return ""
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Main Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col z-10 overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#1A3D63]/10 text-[#1A3D63] flex items-center justify-center flex-shrink-0 font-semibold text-lg">
              {isVideo ? <Film size={20} /> : isImage ? <ImageIcon size={20} /> : isAudio ? <Music size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold text-[#0A1931] truncate">
                {currentResource.title || "Study Material Preview"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                {currentResource.subject_name && (
                  <span className="font-semibold text-[#4A7FA7] flex items-center gap-1">
                    <BookOpen size={12} /> {currentResource.subject_name}
                  </span>
                )}
                {currentResource.uploader_name && (
                  <span className="flex items-center gap-1">
                    <User size={12} /> {currentResource.uploader_name}
                  </span>
                )}
                {currentResource.file_size_mb && (
                  <span className="flex items-center gap-1">
                    <HardDrive size={12} /> {currentResource.file_size_mb} MB
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={handleOpenTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-[#1A3D63] transition-colors shadow-sm"
              title="Open in new window"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors shadow-sm"
              title="Download file"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Preview Area */}
        <div className="flex-1 overflow-auto bg-slate-900/5 p-4 sm:p-6 min-h-[400px] flex items-center justify-center">
          {fileNotFound ? (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-3">
                <AlertTriangle size={28} />
              </div>
              <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">
                Material File Not Found
              </h4>
              <p className="text-xs text-slate-500 mb-6">
                The file for "{currentResource?.title || "this resource"}" could not be located on the server disk.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors"
              >
                Close Preview
              </button>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${fullUrl}#toolbar=1&navpanes=0`}
              className="w-full h-[65vh] rounded-xl border border-slate-200 shadow-sm bg-white"
              title={currentResource.title || "PDF Preview"}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center w-full h-full max-h-[65vh] bg-white rounded-xl p-4 shadow-sm border border-slate-200 overflow-hidden">
              <img
                src={fullUrl}
                alt={currentResource.title || "Image Material"}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : isVideo ? (
            <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
              <video
                src={fullUrl}
                controls
                autoPlay={false}
                className="w-full max-h-[65vh]"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : isAudio ? (
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1A3D63] mx-auto flex items-center justify-center mb-4">
                <Music size={32} />
              </div>
              <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">
                {currentResource.title || "Audio Material"}
              </h4>
              <p className="text-xs text-slate-500 mb-6">Audio Material</p>
              <audio src={fullUrl} controls className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : isText ? (
            <div className="w-full h-[60vh] bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-auto font-mono text-xs text-slate-800 leading-relaxed">
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Loading text content...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono">{textContent}</pre>
              )}
            </div>
          ) : isDoc ? (
            <div className="w-full h-[65vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`}
                className="w-full h-full border-none"
                title={currentResource.title || "Document Preview"}
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText size={28} />
              </div>
              <h4 className="font-heading font-semibold text-slate-800 text-base mb-1">
                {currentResource.title || "Study Material"}
              </h4>
              <p className="text-xs text-slate-500 mb-6">
                Preview is not available for standard direct view. You can open or download the file to view its contents.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenTab}
                  className="px-4 py-2 text-xs font-semibold text-[#1A3D63] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Open in New Tab
                </button>
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3D63] rounded-lg hover:bg-[#0A1931] transition-colors"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Stats & Rating */}
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

          {/* Interactive Rating Control */}
          <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-3 py-1 rounded-xl shadow-xs">
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
