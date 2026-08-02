import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Paperclip, Send, Users, User, ArrowRight, ArrowLeft, CheckCircle2, 
  AlertCircle, Clock, Sparkles, GraduationCap, Search, MessageSquare, 
  Filter, Check, FileText, Globe, Lock, Plus
} from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import Modal from "../components/common/Modal"
import helpImg from "../assets/images/help.png"
import profileImg from "../assets/icons/profile.png"
import { 
  getHelpRequests, 
  createHelpRequest, 
  getAvailableMentors, 
  sendHelpReply, 
  updateHelpStatus 
} from "../api/helpRequestsApi"
import { getSubjects, createSubject } from "../api/subjectsApi"
import { uploadFile } from "../api/resourcesApi"
import { createPublicRequest, createDirectRequest } from "../api/communityApi"

function HelpPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [mentors, setMentors] = useState([])
  const [selectedMentor, setSelectedMentor] = useState("")
  const [deliveryMode, setDeliveryMode] = useState("direct") // "direct" or "public"
  const [subject, setSubject] = useState("Mathematics")
  const [requestType, setRequestType] = useState("Mentor") // "Mentor" or "Peer"
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium") // "Low", "Medium", "High"
  const [successMsg, setSuccessMsg] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Add Subject Modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [newSubjectName, setNewSubjectName]           = useState("")
  const [addingSubject, setAddingSubject]             = useState("")

  async function handleCreateNewSubject(e) {
    if (e) e.preventDefault()
    if (!newSubjectName.trim()) return
    try {
      setAddingSubject(true)
      const res = await createSubject(newSubjectName.trim())
      const createdSub = res.data
      
      // Refresh subjects list
      const subRes = await getSubjects()
      const updatedList = subRes.data || []
      setSubjects(updatedList)

      if (createdSub && createdSub.name) {
        setSubject(createdSub.name)
      }
      setNewSubjectName("")
      setShowAddSubjectModal(false)
    } catch (err) {
      console.error("Failed to add subject:", err)
    } finally {
      setAddingSubject(false)
    }
  }

  // Categorization & Filter States
  const [activeCategoryTab, setActiveCategoryTab] = useState("sent") // "sent" or "received"
  const [statusFilter, setStatusFilter] = useState("All") // "All", "Unseen", "In Progress", "Resolved"
  const [activeDiscussionRequest, setActiveDiscussionRequest] = useState(null)
  const [replyContent, setReplyContent] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fileInputRef = useRef(null)

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Load help requests, available mentors, and subjects on mount
  const loadData = async () => {
    try {
      setLoading(true)
      const reqRes = await getHelpRequests()
      const reqList = reqRes.data.requests || []
      setRequests(reqList)

      // If viewing discussion, update active item from fresh list
      if (activeDiscussionRequest) {
        const updatedItem = reqList.find(r => r.id === activeDiscussionRequest.id)
        if (updatedItem) {
          setActiveDiscussionRequest(updatedItem)
        }
      }

      const mentorRes = await getAvailableMentors()
      const mentorList = mentorRes.data.mentors || []
      setMentors(mentorList)
      if (!selectedMentor) {
        setSelectedMentor("PUBLIC")
      }

      const subRes = await getSubjects()
      const subjectList = subRes.data || []
      setSubjects(subjectList)
      if (subjectList.length > 0 && !subject) {
        setSubject(subjectList[0].name)
      }
    } catch (err) {
      console.error("Failed to load help page data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Submit new help request
  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const matchedMentor = mentors.find(m => m.display === selectedMentor)
    const assignedToId = matchedMentor ? matchedMentor.id : null

    try {
      setUploadingFile(true)
      let attachmentUrl = null
      if (selectedFile) {
        const uploadRes = await uploadFile(selectedFile)
        attachmentUrl = uploadRes.data.file_url
      }

      if (deliveryMode === "direct" && assignedToId) {
        // Direct 1-on-1 Request to Mentor
        await createDirectRequest({
          recipient_id: assignedToId,
          subject: title,
          initial_message: description
        })
      } else {
        // Public Forum Question
        const matchedSub = subjects.find(s => s.name === subject)
        const subId = matchedSub ? matchedSub.id : (subjects[0]?.id || 1)
        await createPublicRequest({
          title: title,
          description: description,
          subject_id: subId,
          attachments: attachmentUrl ? [{ file_url: attachmentUrl, file_name: selectedFile?.name || "Attachment", file_size: selectedFile?.size || 0 }] : []
        })
      }

      // Record in legacy help_requests table for backward compatibility
      await createHelpRequest({
        title: title,
        description: description,
        subject: subject,
        priority: priority.toLowerCase(),
        request_type: requestType.toLowerCase(),
        assigned_to: assignedToId,
        attachment_url: attachmentUrl
      }).catch(() => null)

      setTitle("")
      setDescription("")
      setSelectedFile(null)
      setSuccessMsg(true)
      setTimeout(() => {
        setSuccessMsg(false)
        navigate("/community")
      }, 1500)
    } catch (err) {
      console.error("Failed to submit help request:", err)
    } finally {
      setUploadingFile(false)
    }
  }

  // Send Reply in Discussion View
  async function handleSendReply() {
    if (!replyContent.trim() || !activeDiscussionRequest) return
    try {
      setSendingReply(true)
      await sendHelpReply(activeDiscussionRequest.id, replyContent.trim())
      setReplyContent("")
      await loadData()
    } catch (err) {
      console.error("Failed to send reply:", err)
    } finally {
      setSendingReply(false)
    }
  }

  // Update Request Status (Accept / Resolve)
  async function handleStatusUpdate(newStatus) {
    if (!activeDiscussionRequest) return
    try {
      setActionLoading(true)
      await updateHelpStatus(activeDiscussionRequest.id, newStatus)
      await loadData()
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setActionLoading(false)
    }
  }

  // Calculations & Categorizations
  const sentRequests = requests.filter(r => !r.is_assigned_to_me)
  const receivedRequests = requests.filter(r => r.is_assigned_to_me)

  const currentCategoryList = activeCategoryTab === "sent" ? sentRequests : receivedRequests

  // Apply Status Filter
  const filteredCategoryList = currentCategoryList.filter(req => {
    if (statusFilter === "Unseen") return req.status === "Pending"
    if (statusFilter === "In Progress") return req.status === "Accepted" || req.status === "In progress" || req.status === "In Progress"
    if (statusFilter === "Resolved") return req.status === "Resolved"
    return true
  })

  // Sort: Newest on top, older ones at bottom
  const sortedRequests = [...filteredCategoryList].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
    return dateB - dateA
  })

  const totalRequests = requests.length
  const resolvedRequests = requests.filter(r => r.status === "Resolved").length
  const inProgressRequests = totalRequests - resolvedRequests

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── Top Row: Form & Help Graphic ── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Form (7/12 width) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📩</span>
                <h2 className="font-heading text-lg font-bold text-[#0A1931]">Ask for Help</h2>
              </div>

              {successMsg && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-body text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Your request has been posted successfully! Redirecting to Community...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Available Mentors or Public Forum */}
                <div>
                  <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                    Select Target / Helper
                  </label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedMentor(val)
                      if (val === "PUBLIC") {
                        setDeliveryMode("public")
                        setRequestType("Public")
                      } else {
                        setDeliveryMode("direct")
                        setRequestType("Mentor")
                      }
                    }}
                    className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all cursor-pointer"
                  >
                    <option value="PUBLIC">🌐 Send to Public Forum (Open to All Mentors & Peers)</option>
                    
                    <optgroup label="🎓 Direct 1-on-1 Request to Academic Mentor">
                      {mentors.filter(m => !m.name.startsWith("Peer:")).length > 0 ? (
                        mentors.filter(m => !m.name.startsWith("Peer:")).map(m => (
                          <option key={m.id} value={m.display}>{m.display}</option>
                        ))
                      ) : (
                        <option value="" disabled>No academic mentors available</option>
                      )}
                    </optgroup>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider">
                      Subject
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddSubjectModal(true)}
                      className="font-body text-[11px] font-bold text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <Plus size={13} /> Add New Subject
                    </button>
                  </div>
                  <select
                    value={subject}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowAddSubjectModal(true)
                      } else {
                        setSubject(e.target.value)
                      }
                    }}
                    className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all cursor-pointer"
                  >
                    {subjects.length > 0 ? (
                      subjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))
                    ) : (
                      <option>Loading subjects...</option>
                    )}
                    <option value="__ADD_NEW__" className="font-bold text-[#3b719f]">
                      ➕ Add New Subject...
                    </option>
                  </select>
                </div>


                {/* Topic / Title */}
                <div>
                  <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                    Topic / Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Help understanding Integration by Parts"
                    required
                    className="w-full bg-[#f2f1ed] text-gray-800 placeholder-gray-400 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="relative">
                  <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem in detail..."
                    required
                    rows={3}
                    className="w-full bg-[#f2f1ed] text-gray-800 placeholder-gray-400 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all resize-none"
                  />

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.mp4,image/*"
                  />

                  {/* Form Bottom Actions */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleAttachClick}
                      className="font-body text-xs text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1.5 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Paperclip size={14} />
                      {selectedFile ? selectedFile.name : "Attach File"}
                    </button>

                    <button
                      type="submit"
                      disabled={uploadingFile}
                      className="font-body text-xs font-semibold bg-[#3b719f] text-white px-5 py-2.5 rounded-full hover:bg-[#1A3D63] transition-colors flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      {uploadingFile ? "Uploading..." : "Submit Request"}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Right Graphic Banner (5/12 width) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center bg-[#EAF0F6] rounded-2xl p-6 text-center border border-[#B3CFE5]/30 relative overflow-hidden">
            <img
              src={helpImg}
              alt="Peer & Mentor Assistance"
              className="w-48 h-48 object-contain mb-4"
            />
            <h3 className="font-heading text-base font-bold text-[#1A3D63] mb-1.5">
              Get Guidance Fast
            </h3>
            <p className="font-body text-xs text-[#4A6880] max-w-xs leading-relaxed">
              Connect with verified mentors and active student peers to clear your doubts and stay on track with your coursework.
            </p>
          </div>

        </div>
      </div>

      {/* ── DEDICATED DISCUSSION / REPLY WORKSPACE (REPLACES POPUP MODAL) ── */}
      {activeDiscussionRequest ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <button
              onClick={() => setActiveDiscussionRequest(null)}
              className="font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Request List
            </button>

            <div className="flex items-center gap-3">
              {/* Accept Request Button for Helper */}
              {activeDiscussionRequest.is_assigned_to_me && activeDiscussionRequest.status === "Pending" && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate("in_progress")}
                >
                  <Check size={14} className="mr-1" />
                  Accept Request
                </Button>
              )}

              {/* Resolve Button */}
              {activeDiscussionRequest.status !== "Resolved" && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate("resolved")}
                >
                  <CheckCircle2 size={14} className="mr-1 text-green-600" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </div>

          {/* Request Header Banner */}
          <div className="bg-[#F6FAFD] p-5 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 bg-blue-50 text-[#1A3D63] border border-blue-100 rounded-full font-body text-xs font-bold">
                {activeDiscussionRequest.subject}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full font-body text-xs font-bold ${
                  activeDiscussionRequest.priority === "High" ? "bg-red-50 text-red-600 border border-red-100" :
                  activeDiscussionRequest.priority === "Low" ? "bg-gray-50 text-gray-600 border border-gray-100" :
                  "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  Priority: {activeDiscussionRequest.priority}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-body text-xs font-bold flex items-center gap-1.5 ${
                  activeDiscussionRequest.status === "Accepted" || activeDiscussionRequest.status === "In progress" || activeDiscussionRequest.status === "In Progress"
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : activeDiscussionRequest.status === "Resolved"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  {activeDiscussionRequest.status}
                </span>
              </div>
            </div>

            <h3 className="font-heading text-base font-bold text-[#0A1931]">
              {activeDiscussionRequest.title}
            </h3>
            <p className="font-body text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
              {activeDiscussionRequest.desc || activeDiscussionRequest.description}
            </p>

            {activeDiscussionRequest.attachment_url && (
              <div className="pt-2">
                <a
                  href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${activeDiscussionRequest.attachment_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-body text-xs text-[#3b719f] hover:underline font-bold"
                >
                  📎 Attached File / Document
                </a>
              </div>
            )}
          </div>

          {/* Discussion Thread */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold text-[#0A1931] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} />
              Discussion Thread & Peer Replies
            </h4>

            {activeDiscussionRequest.replies && activeDiscussionRequest.replies.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activeDiscussionRequest.replies.map((r, i) => (
                  <div key={i} className="bg-[#F6FAFD] border-l-4 border-[#4A7FA7] p-4 rounded-r-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-bold text-[#1A3D63]">
                        💬 {r.responder_name} <span className="font-normal text-gray-400">({r.responder_role || "User"})</span>
                      </span>
                      <span className="font-body text-[10px] text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="font-body text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                <p className="font-body text-xs text-amber-700">
                  ⏳ No discussion messages yet. Type your reply below to start chatting!
                </p>
              </div>
            )}
          </div>

          {/* Interactive Reply Input Form */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
            <label className="font-heading text-xs font-bold text-[#1A3D63] block">
              Send Your Reply
            </label>
            <textarea
              rows={3}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your explanation or response here..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 font-body text-xs text-gray-800 focus:outline-none focus:border-[#4A7FA7] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                variant="primary" 
                size="sm" 
                disabled={sendingReply || !replyContent.trim()}
                onClick={handleSendReply}
              >
                <Send size={13} className="mr-1.5" />
                {sendingReply ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>

        </div>
      ) : null}

      {/* ── Row 4: Summary & Tips Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-4">
        
        {/* Request Summary Widget (2/5 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
            <span className="text-sm">📊</span>
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Your Request Summary</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-2">
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-[#1A3D63] block">
                {totalRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                Total Requests
              </span>
            </div>
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-amber-600 block">
                {inProgressRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                In Progress
              </span>
            </div>
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-green-600 block">
                {resolvedRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                Resolved
              </span>
            </div>
          </div>
        </div>

        {/* Tips for Better Requests (3/5 width) */}
        <div className="lg:col-span-3 bg-[#EAF0F6] rounded-2xl p-5 shadow-sm border border-[#B3CFE5]/30 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-[#B3CFE5]/30 pb-3 mb-3">
            <span className="text-sm">💡</span>
            <h3 className="font-heading text-sm font-semibold text-[#1A3D63]">Tips for Better Requests</h3>
          </div>

          <ul className="space-y-2.5 font-body text-xs text-[#4A6880] leading-normal pl-1">
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Be specific about the topic — mention the chapter, exercise number, and exactly where you're stuck.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Mention which module the problem is from so helpers can prepare the right resources for you.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Set the correct priority level so helpers can respond faster to urgent exam-related queries.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Modal: Add New Course Subject ── */}
      {showAddSubjectModal && (
        <Modal isOpen={showAddSubjectModal} onClose={() => setShowAddSubjectModal(false)} title="Add New Course Subject">
          <form onSubmit={handleCreateNewSubject} className="space-y-4">
            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                Subject Name
              </label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Embedded Systems, Software Architecture"
                required
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="font-body text-xs font-bold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <Button variant="primary" size="sm" type="submit" disabled={addingSubject || !newSubjectName.trim()}>
                {addingSubject ? "Adding..." : "Add Subject"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}

export default HelpPage
