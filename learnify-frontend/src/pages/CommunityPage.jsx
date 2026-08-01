import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, MessageSquare, Plus, Search, Filter, Paperclip, Send, 
  ArrowRight, ArrowLeft, CheckCircle2, Clock, FileText, Check, AlertCircle, Sparkles, X, Lock
} from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import Modal from "../components/common/Modal"
import { 
  getCommunitySummary, getPublicRequests, createPublicRequest, createPublicReply,
  getDirectRequests, createDirectRequest, getDirectThread, sendDirectMessage, escalateToDirect
} from "../api/communityApi"
import { getSubjects } from "../api/subjectsApi"
import { getAvailableMentors } from "../api/helpRequestsApi"
import { uploadFile } from "../api/resourcesApi"

// Helper to get role from JWT token
function getRoleFromToken() {
  try {
    const token = localStorage.getItem("access_token")
    if (!token) return "student"
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || "student"
  } catch {
    return "student"
  }
}

// Format byte sizes into KB / MB
function formatFileSize(bytes) {
  if (!bytes) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function CommunityPage() {
  const navigate = useNavigate()
  const currentRole = getRoleFromToken()
  const isMentor = currentRole === "mentor" || currentRole === "admin"

  // Main navigation tab: "public" or "direct"
  const [mainTab, setMainTab] = useState("public")
  const [summaryData, setSummaryData] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [mentors, setMentors] = useState([])

  // ── Public Forum State ─────────────────────────────────────
  const [publicRequests, setPublicRequests] = useState([])
  const [publicLoading, setPublicLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // 'all', 'open', 'answered'
  const [myRequestsFilter, setMyRequestsFilter] = useState(false)
  const [activePublicRequest, setActivePublicRequest] = useState(null)
  const [publicReplyBody, setPublicReplyBody] = useState("")
  const [publicReplyAttachments, setPublicReplyAttachments] = useState([])
  const [submittingPublicReply, setSubmittingPublicReply] = useState(false)

  // ── Direct Requests State ──────────────────────────────────
  const [directTab, setDirectTab] = useState(isMentor ? "inbox" : "sent") // mentors: 'inbox'/'sent', students: 'sent'
  const [directThreads, setDirectThreads] = useState([])
  const [directLoading, setDirectLoading] = useState(true)
  const [activeDirectThread, setActiveDirectThread] = useState(null)
  const [directMessages, setDirectMessages] = useState([])
  const [directMessageBody, setDirectMessageBody] = useState("")
  const [directMessageAttachments, setDirectMessageAttachments] = useState([])
  const [sendingDirectMsg, setSendingDirectMsg] = useState(false)

  // ── Modals & Creation Forms ────────────────────────────────
  const [showAskModal, setShowAskModal] = useState(false)
  const [askTitle, setAskTitle] = useState("")
  const [askDescription, setAskDescription] = useState("")
  const [askSubjectId, setAskSubjectId] = useState("")
  const [askAttachments, setAskAttachments] = useState([])
  const [submittingAsk, setSubmittingAsk] = useState(false)
  const [askError, setAskError] = useState("")

  const [showNewDirectModal, setShowNewDirectModal] = useState(false)
  const [directRecipientId, setDirectRecipientId] = useState("")
  const [directSubject, setDirectSubject] = useState("")
  const [directInitialMsg, setDirectInitialMsg] = useState("")
  const [submittingDirect, setSubmittingDirect] = useState(false)
  const [directError, setDirectError] = useState("")

  const askFileInputRef = useRef(null)
  const replyFileInputRef = useRef(null)
  const directFileInputRef = useRef(null)

  // ── Load Data ──────────────────────────────────────────────
  const loadSummary = async () => {
    try {
      const res = await getCommunitySummary()
      setSummaryData(res.data)
    } catch (err) {
      console.error("Failed to load community summary:", err)
    }
  }

  const loadSubjectsAndMentors = async () => {
    try {
      const subRes = await getSubjects()
      setSubjects(subRes.data || [])
      if (subRes.data && subRes.data.length > 0 && !askSubjectId) {
        setAskSubjectId(subRes.data[0].id)
      }

      const mentorRes = await getAvailableMentors()
      const mentorList = mentorRes.data.mentors || []
      setMentors(mentorList)
      if (mentorList.length > 0 && !directRecipientId) {
        setDirectRecipientId(mentorList[0].id)
      }
    } catch (err) {
      console.error("Failed to load subjects/mentors:", err)
    }
  }

  const fetchPublicFeed = async (showLoading = false) => {
    try {
      if (showLoading) setPublicLoading(true)
      const params = {}
      if (selectedSubjectFilter) params.subject_id = selectedSubjectFilter
      if (myRequestsFilter) params.my_requests = "true"
      if (statusFilter !== "all") params.status = statusFilter
      if (searchQuery) params.search = searchQuery

      const res = await getPublicRequests(params)
      const list = res.data.requests || []
      setPublicRequests(list)

      if (activePublicRequest) {
        const updated = list.find(r => r.id === activePublicRequest.id)
        if (updated) setActivePublicRequest(updated)
      }
    } catch (err) {
      console.error("Failed to load public requests:", err)
    } finally {
      setPublicLoading(false)
    }
  }

  const fetchDirectFeed = async (showLoading = false) => {
    try {
      if (showLoading) setDirectLoading(true)
      const res = await getDirectRequests(directTab)
      setDirectThreads(res.data.threads || [])
    } catch (err) {
      console.error("Failed to load direct requests:", err)
    } finally {
      setDirectLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
    loadSubjectsAndMentors()
  }, [])

  useEffect(() => {
    if (mainTab === "public") {
      fetchPublicFeed(true)
      const interval = setInterval(() => fetchPublicFeed(false), 5000) // Silent background sync
      return () => clearInterval(interval)
    } else {
      fetchDirectFeed(true)
      const interval = setInterval(() => fetchDirectFeed(false), 5000) // Silent background sync
      return () => clearInterval(interval)
    }
  }, [mainTab, selectedSubjectFilter, myRequestsFilter, statusFilter, searchQuery, directTab])

  // Open Direct Thread & Mark Read
  const openDirectThread = async (threadId) => {
    try {
      const res = await getDirectThread(threadId)
      setActiveDirectThread(res.data.thread)
      setDirectMessages(res.data.messages || [])
      fetchDirectFeed() // Refresh badge counts
    } catch (err) {
      console.error("Failed to open direct thread:", err)
    }
  }

  // Poll active direct thread messages if open
  useEffect(() => {
    if (activeDirectThread) {
      const interval = setInterval(async () => {
        const res = await getDirectThread(activeDirectThread.id).catch(() => null)
        if (res && res.data) {
          setDirectMessages(res.data.messages || [])
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeDirectThread])

  // ── Attachment Pickers ─────────────────────────────────────
  const handleFileUpload = async (e, setAttachmentsState) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit.`)
        continue
      }

      try {
        const uploadRes = await uploadFile(file)
        const fileUrl = uploadRes.data.file_url
        setAttachmentsState(prev => [...prev, {
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size
        }])
      } catch (err) {
        console.error("Failed to upload attachment:", err)
      }
    }
  }

  // ── Actions: Ask Question ──────────────────────────────────
  const handleSubmitAsk = async (e) => {
    e.preventDefault()
    if (!askTitle.trim() || !askDescription.trim() || !askSubjectId) return

    try {
      setSubmittingAsk(true)
      setAskError("")
      await createPublicRequest({
        title: askTitle.trim(),
        description: askDescription.trim(),
        subject_id: askSubjectId,
        attachments: askAttachments
      })
      setAskTitle("")
      setAskDescription("")
      setAskAttachments([])
      setShowAskModal(false)
      fetchPublicFeed()
      loadSummary()
    } catch (err) {
      setAskError(err.response?.data?.message || "Failed to post question.")
    } finally {
      setSubmittingAsk(false)
    }
  }

  // ── Actions: Public Reply ──────────────────────────────────
  const handleSubmitPublicReply = async () => {
    if (!publicReplyBody.trim() || !activePublicRequest) return
    try {
      setSubmittingPublicReply(true)
      await createPublicReply(activePublicRequest.id, {
        body: publicReplyBody.trim(),
        attachments: publicReplyAttachments
      })
      setPublicReplyBody("")
      setPublicReplyAttachments([])
      fetchPublicFeed()
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post reply.")
    } finally {
      setSubmittingPublicReply(false)
    }
  }

  // ── Actions: Escalate to Direct ("Continue Privately") ─────
  const handleEscalateToPrivate = async (publicRequestId, publicReplyId) => {
    try {
      const res = await escalateToDirect(publicRequestId, publicReplyId)
      const threadId = res.data.thread_id
      setMainTab("direct")
      setDirectTab("sent")
      openDirectThread(threadId)
    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate private thread.")
    }
  }

  // ── Actions: Create Direct Request ────────────────────────
  const handleSubmitDirect = async (e) => {
    e.preventDefault()
    if (!directRecipientId || !directSubject.trim() || !directInitialMsg.trim()) return

    try {
      setSubmittingDirect(true)
      setDirectError("")
      const res = await createDirectRequest({
        recipient_id: directRecipientId,
        subject: directSubject.trim(),
        initial_message: directInitialMsg.trim()
      })
      setDirectSubject("")
      setDirectInitialMsg("")
      setShowNewDirectModal(false)
      setMainTab("direct")
      setDirectTab("sent")
      openDirectThread(res.data.thread_id)
    } catch (err) {
      setDirectError(err.response?.data?.message || "Failed to send direct request.")
    } finally {
      setSubmittingDirect(false)
    }
  }

  // ── Actions: Send Direct Message ──────────────────────────
  const handleSendDirectMessage = async () => {
    if (!directMessageBody.trim() || !activeDirectThread) return
    try {
      setSendingDirectMsg(true)
      await sendDirectMessage(activeDirectThread.id, {
        body: directMessageBody.trim(),
        attachments: directMessageAttachments
      })
      setDirectMessageBody("")
      setDirectMessageAttachments([])
      const res = await getDirectThread(activeDirectThread.id)
      setDirectMessages(res.data.messages || [])
    } catch (err) {
      console.error("Failed to send direct message:", err)
    } finally {
      setSendingDirectMsg(false)
    }
  }

  const unreadTotalDirect = directThreads.reduce((acc, t) => acc + (t.unread_count || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── TOP HEADER BANNER & SUMMARY STRIP ── */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3D63] rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="text-[#3b719f]" size={28} />
            <h1 className="font-heading text-2xl font-bold">Community Hub</h1>
          </div>
          <p className="font-body text-xs text-gray-300 max-w-xl leading-relaxed">
            Collaborate in the open Public Q&A Forum or engage in private 1-on-1 Direct Requests with academic mentors.
          </p>

          {/* Live Summary Strip */}
          <div className="flex items-center gap-4 pt-2">
            <span className="bg-white/10 px-3 py-1 rounded-full font-body text-xs font-semibold border border-white/10 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              {summaryData ? summaryData.summary_text : "Loading metrics..."}
            </span>
          </div>
        </div>

        {/* Persistent Ask a Question Action Button */}
        <Button 
          variant="primary" 
          icon={Plus} 
          onClick={() => navigate("/help")}
          className="bg-[#3b719f] hover:bg-[#2c587c] text-white px-6 py-3 rounded-2xl shadow-md border-none cursor-pointer"
        >
          Ask a Question
        </Button>
      </div>

      {/* ── TOP-LEVEL TABS: PUBLIC FORUM | DIRECT REQUESTS ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setMainTab("public"); setActivePublicRequest(null); }}
            className={`font-heading text-sm font-bold px-6 py-3 rounded-2xl transition-all border-none cursor-pointer flex items-center gap-2 ${
              mainTab === "public"
                ? "bg-[#0A1931] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Users size={16} />
            Public Forum
          </button>

          <button
            onClick={() => { setMainTab("direct"); setActiveDirectThread(null); }}
            className={`font-heading text-sm font-bold px-6 py-3 rounded-2xl transition-all border-none cursor-pointer flex items-center gap-2 relative ${
              mainTab === "direct"
                ? "bg-[#0A1931] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <MessageSquare size={16} />
            Direct Requests
            {unreadTotalDirect > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
        </div>

        {mainTab === "direct" && (
          <Button 
            variant="secondary" 
            size="sm" 
            icon={Plus}
            onClick={() => setShowNewDirectModal(true)}
          >
            New Direct Request
          </Button>
        )}
      </div>

      {/* ── VIEW 1: PUBLIC FORUM ── */}
      {mainTab === "public" && (
        activePublicRequest ? (
          /* Public Question Discussion Thread */
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <button
                onClick={() => setActivePublicRequest(null)}
                className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back to Public Forum
              </button>
              <span className="px-3 py-1 bg-blue-50 text-[#1A3D63] border border-blue-100 rounded-full font-body text-xs font-bold">
                {activePublicRequest.subject_name}
              </span>
            </div>

            {/* Question Details Banner */}
            <div className="bg-[#F6FAFD] p-5 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={activePublicRequest.requester_name} color="primary" size="sm" />
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#0A1931]">
                    {activePublicRequest.requester_name} <span className="font-normal text-gray-400">({activePublicRequest.requester_role})</span>
                  </h4>
                  <p className="font-body text-[10px] text-gray-400">
                    {activePublicRequest.created_at ? new Date(activePublicRequest.created_at).toLocaleString() : ""}
                  </p>
                </div>
              </div>

              <h2 className="font-heading text-lg font-bold text-[#0A1931]">
                {activePublicRequest.title}
              </h2>
              <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {activePublicRequest.description}
              </p>

              {/* Question Attachments */}
              {activePublicRequest.attachments && activePublicRequest.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/50">
                  {activePublicRequest.attachments.map(att => (
                    <a
                      key={att.id}
                      href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${att.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-body text-[11px] font-bold text-[#3b719f] hover:underline flex items-center gap-1.5"
                    >
                      <Paperclip size={12} />
                      {att.file_name} ({formatFileSize(att.file_size)})
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Flat Replies List */}
            <div className="space-y-4">
              <h3 className="font-heading text-sm font-bold text-[#0A1931] flex items-center gap-2">
                <MessageSquare size={16} />
                Answers & Peer Contributions ({activePublicRequest.replies.length})
              </h3>

              {activePublicRequest.replies.length === 0 ? (
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                  <p className="font-body text-xs text-amber-700">
                    No answers posted yet. Be the first to answer this question!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePublicRequest.replies.map(rep => (
                    <div key={rep.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={rep.author_name} color={rep.is_mentor ? "primary" : "gray"} size="xs" />
                          <span className="font-heading text-xs font-bold text-[#0A1931]">
                            {rep.author_name} <span className="font-normal text-gray-400">({rep.author_role})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-body text-[10px] text-gray-400">
                            {rep.created_at ? new Date(rep.created_at).toLocaleString() : ""}
                          </span>
                          
                          {/* Mentor Escalation Button: "Continue Privately" */}
                          {rep.is_mentor && (
                            <button
                              onClick={() => handleEscalateToPrivate(activePublicRequest.id, rep.id)}
                              className="font-body text-[10px] font-bold bg-blue-50 text-[#1A3D63] hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Lock size={10} />
                              Continue Privately
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pl-7">
                        {rep.body}
                      </p>

                      {rep.attachments && rep.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-7 pt-1">
                          {rep.attachments.map(att => (
                            <a
                              key={att.id}
                              href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${att.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg font-body text-[10px] text-[#3b719f] hover:underline flex items-center gap-1"
                            >
                              <Paperclip size={10} />
                              {att.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Answer Section (Enforces 1 reply limit) */}
            {activePublicRequest.has_user_replied ? (
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-2xl text-center">
                <p className="font-body text-xs text-gray-600 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} className="text-green-600" />
                  You have already posted an answer to this question.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                <label className="font-heading text-xs font-bold text-[#0A1931] block">
                  Post Your Answer (1 answer limit)
                </label>
                <textarea
                  rows={3}
                  value={publicReplyBody}
                  onChange={(e) => setPublicReplyBody(e.target.value)}
                  placeholder="Provide your solution or answer here..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 font-body text-xs text-gray-800 focus:outline-none focus:border-[#4A7FA7] resize-none"
                />

                {/* Pre-submit attachment preview chips */}
                {publicReplyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {publicReplyAttachments.map((att, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 px-3 py-1 rounded-full font-body text-[10px] text-gray-600 flex items-center gap-1.5 shadow-sm">
                        <Paperclip size={11} className="text-[#3b719f]" />
                        {att.file_name} ({formatFileSize(att.file_size)})
                        <button
                          type="button"
                          onClick={() => setPublicReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 border-none bg-transparent cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  ref={replyFileInputRef}
                  onChange={(e) => handleFileUpload(e, setPublicReplyAttachments)}
                  multiple
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf,.docx"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="font-body text-xs text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer font-semibold"
                  >
                    <Paperclip size={14} />
                    Attach Resources
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={submittingPublicReply || !publicReplyBody.trim()}
                    onClick={handleSubmitPublicReply}
                  >
                    <Send size={13} className="mr-1.5" />
                    {submittingPublicReply ? "Posting..." : "Submit Answer"}
                  </Button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Public Forum Main Feed */
          <div className="space-y-5">
            {/* Filters & Search Header Controls */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions by keyword or subject..."
                    className="w-full bg-[#f8fafc] text-gray-800 font-body text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3b719f]"
                  />
                </div>

                {/* Subject Dropdown Filter */}
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="bg-[#f8fafc] text-gray-800 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3b719f] cursor-pointer"
                >
                  <option value="">All Course Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMyRequestsFilter(!myRequestsFilter)}
                  className={`font-body text-xs font-semibold px-4 py-2 rounded-xl transition-all border-none cursor-pointer ${
                    myRequestsFilter
                      ? "bg-[#3b719f] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  My Questions Only
                </button>

                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                  {["all", "open", "answered"].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`font-body text-[11px] font-semibold px-3 py-1 rounded-lg capitalize border-none cursor-pointer ${
                        statusFilter === st ? "bg-white text-[#0A1931] shadow-xs" : "text-gray-500"
                      }`}
                    >
                      {st === "all" ? "Newest" : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public Questions Feed List (Stack Overflow Style) */}
            {publicLoading ? (
              <div className="text-center py-12 text-gray-400 text-xs">Loading public questions...</div>
            ) : publicRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
                <FileText size={32} className="text-gray-300 mx-auto" />
                <p className="font-heading text-sm font-semibold text-gray-500">
                  No public questions found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 divide-y divide-gray-100">
                {publicRequests.map(req => (
                  <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start gap-4 md:gap-6 hover:bg-gray-50/50 p-3 rounded-2xl transition-colors">
                    
                    {/* Left Column Stats (Votes, Answers count, Status) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-28 shrink-0 text-right space-y-1 text-xs font-body border-b sm:border-b-0 border-gray-100 pb-2 sm:pb-0">
                      <div className="text-gray-500 font-semibold text-xs">
                        0 votes
                      </div>
                      
                      <div className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                        req.replies && req.replies.length > 0
                          ? "border border-green-600 text-green-700 bg-green-50 font-bold"
                          : "text-gray-500"
                      }`}>
                        {req.replies ? req.replies.length : 0} {req.replies && req.replies.length === 1 ? "answer" : "answers"}
                      </div>

                      <div className="text-gray-400 text-[11px] capitalize">
                        {req.status === "answered" ? "Answered" : "Open"}
                      </div>
                    </div>

                    {/* Right Content Column */}
                    <div className="flex-1 space-y-2 w-full">
                      <h3 
                        onClick={() => setActivePublicRequest(req)}
                        className="font-heading text-base font-semibold text-[#0074cc] hover:text-[#005999] cursor-pointer leading-snug transition-colors"
                      >
                        {req.title}
                      </h3>

                      <p className="font-body text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      {/* Bottom Bar: Tags & Author Info */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-body text-[11px] font-semibold rounded-md">
                            {req.subject_name}
                          </span>
                          {req.attachments && req.attachments.length > 0 && (
                            <span className="text-[11px] text-gray-400 font-body flex items-center gap-1">
                              <Paperclip size={12} /> {req.attachments.length} files
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-body">
                          <Avatar name={req.requester_name} color="primary" size="xs" />
                          <span className="font-semibold text-[#0074cc]">
                            {req.requester_name}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            asked {req.created_at ? new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* ── VIEW 2: DIRECT REQUESTS (1-ON-1 CHAT) ── */}
      {mainTab === "direct" && (
        activeDirectThread ? (
          /* Active Direct Thread Workspace */
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <button
                onClick={() => setActiveDirectThread(null)}
                className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back to Direct Requests
              </button>
              <div className="flex items-center gap-2">
                <Avatar name={activeDirectThread.recipient_name || activeDirectThread.sender_name} color="primary" size="xs" />
                <span className="font-heading text-xs font-bold text-[#0A1931]">
                  Direct Chat with {activeDirectThread.recipient_name || activeDirectThread.sender_name}
                </span>
              </div>
            </div>

            {/* Initial Subject Banner */}
            <div className="bg-[#F6FAFD] p-4 rounded-2xl border border-gray-100">
              <h4 className="font-heading text-xs font-bold text-[#0A1931]">
                Subject: {activeDirectThread.subject}
              </h4>
              <p className="font-body text-xs text-gray-600 mt-1">
                {activeDirectThread.initial_message}
              </p>
            </div>

            {/* Chat History Messages */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {directMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 p-3.5 rounded-2xl max-w-xl ${
                    msg.sender_id === activeDirectThread.sender_id
                      ? "bg-blue-50 text-[#0A1931] border border-blue-100 self-start"
                      : "bg-gray-100 text-gray-800 self-end ml-auto"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-heading text-[10px] font-bold text-[#1A3D63]">
                      {msg.sender_name} ({msg.sender_role})
                    </span>
                    <span className="font-body text-[9px] text-gray-400">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>

                  <p className="font-body text-xs whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.attachments.map(att => (
                        <a
                          key={att.id}
                          href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${att.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-white border border-gray-200 rounded-lg font-body text-[10px] text-[#3b719f] hover:underline flex items-center gap-1"
                        >
                          <Paperclip size={10} />
                          {att.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Send Direct Message Box */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <textarea
                rows={2}
                value={directMessageBody}
                onChange={(e) => setDirectMessageBody(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 font-body text-xs text-gray-800 focus:outline-none focus:border-[#4A7FA7] resize-none"
              />

              {directMessageAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {directMessageAttachments.map((att, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 px-3 py-1 rounded-full font-body text-[10px] text-gray-600 flex items-center gap-1.5 shadow-sm">
                      <Paperclip size={11} className="text-[#3b719f]" />
                      {att.file_name}
                      <button
                        type="button"
                        onClick={() => setDirectMessageAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="hover:text-red-500 border-none bg-transparent cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="file"
                ref={directFileInputRef}
                onChange={(e) => handleFileUpload(e, setDirectMessageAttachments)}
                multiple
                className="hidden"
                accept=".png,.jpg,.jpeg,.pdf,.docx"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => directFileInputRef.current?.click()}
                  className="font-body text-xs text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer font-semibold"
                >
                  <Paperclip size={14} />
                  Attach Files
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={sendingDirectMsg || !directMessageBody.trim()}
                  onClick={handleSendDirectMessage}
                >
                  <Send size={13} className="mr-1.5" />
                  {sendingDirectMsg ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>

          </div>
        ) : (
          /* Direct Requests List */
          <div className="space-y-4">
            {/* Mentor Inbox vs Sent Toggle (Hidden for Students) */}
            {isMentor && (
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <button
                  onClick={() => setDirectTab("inbox")}
                  className={`font-heading text-xs font-bold px-4 py-2 rounded-full border-none cursor-pointer ${
                    directTab === "inbox" ? "bg-[#0A1931] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Inbox (Received)
                </button>
                <button
                  onClick={() => setDirectTab("sent")}
                  className={`font-heading text-xs font-bold px-4 py-2 rounded-full border-none cursor-pointer ${
                    directTab === "sent" ? "bg-[#0A1931] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Sent Requests
                </button>
              </div>
            )}

            {directLoading ? (
              <div className="text-center py-12 text-gray-400 text-xs">Loading direct requests...</div>
            ) : directThreads.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
                <MessageSquare size={32} className="text-gray-300 mx-auto" />
                <p className="font-heading text-sm font-semibold text-gray-500">
                  No direct requests in your {directTab}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {directThreads.map(t => (
                  <div
                    key={t.id}
                    onClick={() => openDirectThread(t.id)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 hover:shadow-md transition-shadow cursor-pointer relative"
                  >
                    {t.unread_count > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute top-4 right-4" />
                    )}
                    <div className="flex items-center gap-3">
                      <Avatar name={t.other_user_name} color="primary" size="xs" />
                      <div>
                        <h4 className="font-heading text-xs font-bold text-[#0A1931]">
                          {t.other_user_name}
                        </h4>
                        <p className="font-body text-[10px] text-gray-400">{t.other_user_role}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-heading text-xs font-bold text-[#0A1931] line-clamp-1">
                        {t.subject}
                      </h5>
                      <p className="font-body text-[11px] text-gray-500 line-clamp-2">
                        {t.initial_message}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}</span>
                      <span className="font-bold text-[#3b719f] flex items-center gap-1">
                        Open Thread <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* ── MODAL 1: ASK A QUESTION MODAL ── */}
      {showAskModal && (
        <Modal isOpen={showAskModal} onClose={() => setShowAskModal(false)} title="Ask a Community Question">
          <form onSubmit={handleSubmitAsk} className="space-y-4">
            {askError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl font-body text-xs font-semibold">
                {askError}
              </div>
            )}

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Course Subject
              </label>
              <select
                value={askSubjectId}
                onChange={(e) => setAskSubjectId(e.target.value)}
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Question Title
              </label>
              <input
                type="text"
                value={askTitle}
                onChange={(e) => setAskTitle(e.target.value)}
                placeholder="e.g. How does backpropagation work in Neural Networks?"
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none"
              />
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Problem Description
              </label>
              <textarea
                rows={4}
                value={askDescription}
                onChange={(e) => setAskDescription(e.target.value)}
                placeholder="Describe your question in detail..."
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none resize-none"
              />
            </div>

            {/* Attachments */}
            {askAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {askAttachments.map((att, idx) => (
                  <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full font-body text-[10px] text-gray-700 flex items-center gap-1.5">
                    <Paperclip size={11} className="text-[#3b719f]" />
                    {att.file_name} ({formatFileSize(att.file_size)})
                    <button
                      type="button"
                      onClick={() => setAskAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="hover:text-red-500 border-none bg-transparent cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="file"
              ref={askFileInputRef}
              onChange={(e) => handleFileUpload(e, setAskAttachments)}
              multiple
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf,.docx"
            />

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => askFileInputRef.current?.click()}
                className="font-body text-xs text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer font-semibold"
              >
                <Paperclip size={14} />
                Attach Files (Max 10MB)
              </button>

              <Button variant="primary" size="sm" type="submit" disabled={submittingAsk}>
                {submittingAsk ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL 2: NEW DIRECT REQUEST MODAL ── */}
      {showNewDirectModal && (
        <Modal isOpen={showNewDirectModal} onClose={() => setShowNewDirectModal(false)} title="Start 1-on-1 Direct Request">
          <form onSubmit={handleSubmitDirect} className="space-y-4">
            {directError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl font-body text-xs font-semibold">
                {directError}
              </div>
            )}

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Select Mentor
              </label>
              <select
                value={directRecipientId}
                onChange={(e) => setDirectRecipientId(e.target.value)}
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none"
              >
                {mentors.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.specialty})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Subject Title
              </label>
              <input
                type="text"
                value={directSubject}
                onChange={(e) => setDirectSubject(e.target.value)}
                placeholder="e.g. Guidance on Final Project Architecture"
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none"
              />
            </div>

            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1">
                Initial Message
              </label>
              <textarea
                rows={4}
                value={directInitialMsg}
                onChange={(e) => setDirectInitialMsg(e.target.value)}
                placeholder="Write your private message to the mentor..."
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="primary" size="sm" type="submit" disabled={submittingDirect}>
                {submittingDirect ? "Starting..." : "Start Direct Request"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}

export default CommunityPage
