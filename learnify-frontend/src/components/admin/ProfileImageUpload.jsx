import { useState, useRef } from "react"
import { Upload, X, ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_LABEL  = "JPG, PNG, WEBP"
const MAX_SIZE_MB    = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function ProfileImageUpload({
  currentImage,
  initials,
  onUpload,
  onClose,
  uploading,
}) {
  const [preview,  setPreview]  = useState(null)
  const [file,     setFile]     = useState(null)
  const [error,    setError]    = useState("")
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function validate(f) {
    if (!ALLOWED_TYPES.includes(f.type))
      return `Unsupported format. Use ${ALLOWED_LABEL}.`
    if (f.size > MAX_SIZE_BYTES)
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_SIZE_MB} MB.`
    return null
  }

  function processFile(f) {
    setError("")
    const err = validate(f)
    if (err) { setError(err); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const onInputChange  = e  => { if (e.target.files[0]) processFile(e.target.files[0]) }
  const onDrop         = e  => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }
  const onDragOver     = e  => { e.preventDefault(); setDragging(true) }
  const onDragLeave    = () => setDragging(false)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
      flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading text-base font-bold text-[#0A1931]">
            Change Profile Picture
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Current ➜ Preview */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">
                Current
              </p>
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md mx-auto">
                {currentImage ? (
                  <img src={currentImage} alt="current" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63]
                    flex items-center justify-center">
                    <span className="font-heading font-bold text-white text-xl">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1 text-gray-300">
              <div className="w-8 h-px bg-gray-200" />
              <span className="text-lg">→</span>
            </div>

            <div className="text-center">
              <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">
                Preview
              </p>
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md mx-auto bg-gray-50 flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={26} className="text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer
              transition-all duration-200 select-none
              ${dragging
                ? "border-[#4A7FA7] bg-[#EBF3F9]"
                : "border-gray-200 hover:border-[#4A7FA7] hover:bg-gray-50"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onInputChange}
              className="hidden"
            />
            <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors
              ${dragging ? "bg-[#4A7FA7]/10" : "bg-gray-100"}`}>
              <Upload size={22} className={dragging ? "text-[#4A7FA7]" : "text-gray-400"} />
            </div>
            <p className="font-body text-sm font-semibold text-[#0A1931]">
              {file ? file.name : "Drag & drop or click to browse"}
            </p>
            <p className="font-body text-xs text-gray-400 mt-1">
              {ALLOWED_LABEL} · max {MAX_SIZE_MB} MB
            </p>
            {file && !error && (
              <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold
                text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                {(file.size / 1024).toFixed(0)} KB · ready to upload
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50
              border border-red-100 rounded-xl">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 font-body text-sm
                font-semibold text-gray-600 hover:bg-gray-50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={() => file && onUpload(file, preview)}
              disabled={!file || !!error || uploading}
              className="flex-1 py-2.5 rounded-xl bg-[#0A1931] text-white font-body text-sm
                font-semibold hover:bg-[#1A3D63] transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Save Picture
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
