import { useState } from "react"
import {
  Search, Filter, CheckCircle2, XCircle, Play, Send,
  Paperclip, Clock, AlertCircle, MessageSquare, BookOpen, User
} from "lucide-react"
import Avatar from "../../components/common/Avatar"
import Badge from "../../components/common/Badge"
import Button from "../../components/common/Button"
import profileImg from "../../assets/icons/profile.png"

// ── Mock Data for Student Help Requests ────────────────────
const initialRequests = [
  {
    id: 101,
    studentName: "Ashani Weerasinghe",
    studentInitials: "AW",
    subject: "Mathematics",
    title: "Need help with Integration by Parts",
    description: "I'm having trouble applying integration by parts to trigonometric functions. Specifically, when we have repeating integrals like e^x * sin(x). Any simple shortcut or method to remember the sequence?",
    priority: "High",
    status: "Pending",
    date: "10 mins ago",
    replies: []
  },
  {
    id: 102,
    studentName: "M. Nayana",
    studentInitials: "MN",
    subject: "Geometry",
    title: "Proof by Contradiction in Triangles",
    description: "I am confused on how to start the proof showing that a triangle cannot have more than one obtuse angle using proof by contradiction. What is the negation statement I should begin with?",
    priority: "Medium",
    status: "In Progress",
    date: "1 hour ago",
    replies: [
      {
        id: 1,
        sender: "mentor",
        content: "Hi Nayana, for proof by contradiction, start by assuming the opposite of what you want to prove. Assume the triangle *does* have two obtuse angles (both > 90 degrees). Then calculate the sum of angles. It will exceed 180 degrees, which contradicts the triangle sum theorem!",
        time: "45 mins ago"
      }
    ]
  },
  {
    id: 103,
    studentName: "Kavindu Chamith",
    studentInitials: "KC",
    subject: "Statistics",
    title: "Regression Analysis & R-Squared Value",
    description: "Could you explain what a low R-squared value with a significant p-value means in a linear regression? Does it mean the model is still useful?",
    priority: "Low",
    status: "Resolved",
    date: "Yesterday",
    replies: [
      {
        id: 1,
        sender: "mentor",
        content: "A low R-squared but low p-value means that your independent variables are still statistically significant (there is a real relationship), but they do not explain much of the variability in the dependent variable. It is common in social sciences where behavior is hard to predict.",
        time: "Yesterday, 3:00 PM"
      },
      {
        id: 2,
        sender: "student",
        content: "That makes perfect sense. Thank you so much, Dr. Davis! I will mark this as resolved.",
        time: "Yesterday, 4:15 PM"
      }
    ]
  },
  {
    id: 104,
    studentName: "Mugith Nayana",
    studentInitials: "MN",
    subject: "Algebra",
    title: "Matrix Multiplication Dimensions mismatch",
    description: "Why does multiplying a 3x2 matrix by a 3x2 matrix fail? I keep getting errors. What is the dimensional rule for matrix multiplication?",
    priority: "High",
    status: "Pending",
    date: "2 hours ago",
    replies: []
  }
]

export default function MentorRequestsPage() {
  const [requests, setRequests] = useState(initialRequests)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All") // "All", "Pending", "In Progress", "Resolved"
  const [replyText, setReplyText] = useState("")

  // Calculate Metrics
  const pendingCount = requests.filter(r => r.status === "Pending").length
  const activeCount = requests.filter(r => r.status === "In Progress").length
  const resolvedCount = requests.filter(r => r.status === "Resolved").length

  // Find currently selected request
  const selectedRequest = requests.find(r => r.id === selectedRequestId)

  // Filter Requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "All" || req.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Action: Accept Request
  function handleAccept(id) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "In Progress" } : r))
  }

  // Action: Decline Request
  function handleDecline(id) {
    if (confirm("Are you sure you want to decline this request?")) {
      setRequests(prev => prev.filter(r => r.id !== id))
      if (selectedRequestId === id) {
        setSelectedRequestId(null)
      }
    }
  }

  // Action: Resolve Request
  function handleResolve(id) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Resolved" } : r))
  }

  // Action: Send Reply Message
  function handleSendReply() {
    if (!replyText.trim() || !selectedRequestId) return

    const newReply = {
      id: Date.now(),
      sender: "mentor",
      content: replyText,
      time: "Just now"
    }

    setRequests(prev => prev.map(r => {
      if (r.id === selectedRequestId) {
        return {
          ...r,
          // Auto transition to "In Progress" if a message is sent on a "Pending" request
          status: r.status === "Pending" ? "In Progress" : r.status,
          replies: [...r.replies, newReply]
        }
      }
      return r
    }))

    setReplyText("")
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#0A1931]">
      
      {/* ── 1. Stats Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Pending Requests</p>
            <span className="font-heading text-3xl font-extrabold text-red-600 block mt-1">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Active Discussions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">In Progress</p>
            <span className="font-heading text-3xl font-extrabold text-blue-600 block mt-1">{activeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Resolved Requests */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Resolved Help</p>
            <span className="font-heading text-3xl font-extrabold text-green-600 block mt-1">{resolvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Average response time */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Avg Response Time</p>
            <span className="font-heading text-3xl font-extrabold text-teal-600 block mt-1">18 mins</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* ── 2. Filters Panel ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by topic, student, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 font-body text-xs focus:outline-none focus:border-[#4A7FA7] transition-colors"
          />
          <Search size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", "Pending", "In Progress", "Resolved"].map(status => {
            const isActive = statusFilter === status
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`font-body text-xs font-semibold px-4 py-2 rounded-xl transition-all border ${
                  isActive
                    ? "bg-[#0A1931] border-[#0A1931] text-white shadow-sm"
                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                }`}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 3. List-Detail Layout Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Requests List (5/12 width) */}
        <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
              <BookOpen size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="font-body text-xs text-gray-400 font-medium">No help requests found matching criteria.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isSelected = selectedRequestId === req.id
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
                    isSelected ? "border-[#4A7FA7] ring-1 ring-[#4A7FA7]/20" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={req.studentName === "M. Nayana" ? profileImg : null} name={req.studentName} color="primary" size="xs" />
                      <div>
                        <h4 className="font-heading text-xs font-bold text-[#0A1931]">{req.studentName}</h4>
                        <p className="font-body text-[9px] text-gray-400">{req.date}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-body text-[9px] font-bold ${
                        req.status === "Pending" ? "bg-red-50 text-red-600 border border-red-100" :
                        req.status === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {req.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-body text-[9px] font-bold ${
                        req.priority === "High" ? "bg-red-100 text-red-700" :
                        req.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full font-body text-[9px] font-bold text-gray-500">
                      {req.subject}
                    </span>
                    <h5 className="font-heading text-xs font-bold text-[#1A3D63] leading-tight pt-1">
                      {req.title}
                    </h5>
                    <p className="font-body text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Side: Request Details & Action Box (7/12 width) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden min-h-[500px]">
          {selectedRequest ? (
            <div className="flex flex-col h-full justify-between flex-1">
              
              {/* Detailed Header */}
              <div className="px-6 py-4 border-b border-gray-50 bg-[#F6FAFD]/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedRequest.studentName === "M. Nayana" ? profileImg : null} name={selectedRequest.studentName} color="primary" size="md" />
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#0A1931]">{selectedRequest.studentName}</h4>
                    <p className="font-body text-[10px] text-gray-400">Subject: <span className="font-semibold text-gray-600">{selectedRequest.subject}</span> · Submitted {selectedRequest.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[10px] font-bold ${
                    selectedRequest.status === "Pending" ? "bg-red-50 text-red-600 border border-red-100" :
                    selectedRequest.status === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                    "bg-green-50 text-green-600 border border-green-100"
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Detailed Content Pane */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Description Segment */}
                <div className="space-y-2.5">
                  <h3 className="font-heading text-base font-extrabold text-[#0A1931] leading-snug">
                    {selectedRequest.title}
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <p className="font-body text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.description}
                    </p>
                  </div>
                </div>

                {/* Primary Action bar for Pending tickets */}
                {selectedRequest.status === "Pending" && (
                  <div className="flex items-center gap-3 bg-red-50/40 border border-red-100 p-4 rounded-2xl">
                    <div className="flex-1">
                      <p className="font-body text-xs font-bold text-red-950">Awaiting Your Acceptance</p>
                      <p className="font-body text-[10px] text-red-700/80 mt-0.5">Accept this ticket to begin a study discussion with the student.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(selectedRequest.id)}
                        className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-600 bg-white hover:bg-red-50 rounded-xl font-body text-xs font-bold transition-all"
                      >
                        <XCircle size={13} />
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(selectedRequest.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-[#0A1931] hover:bg-[#1A3D63] text-white rounded-xl font-body text-xs font-bold transition-all shadow-sm border-none cursor-pointer"
                      >
                        <Play size={13} className="fill-white" />
                        Accept
                      </button>
                    </div>
                  </div>
                )}

                {/* Discussion Log */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-heading text-xs font-bold text-[#4A7FA7] uppercase tracking-wider block border-b border-gray-50 pb-2">
                    Discussion History ({selectedRequest.replies.length})
                  </h4>

                  {selectedRequest.replies.length === 0 ? (
                    <p className="font-body text-xs text-gray-400 text-center py-6">
                      No messages exchanged yet. Send a response below to start.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {selectedRequest.replies.map(reply => (
                        <div
                          key={reply.id}
                          className={`flex gap-3 max-w-[85%] ${reply.sender === "mentor" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                          <Avatar
                            src={reply.sender === "mentor" ? null : profileImg}
                            name={reply.sender === "mentor" ? "Dr. Davis" : selectedRequest.studentName}
                            color={reply.sender === "mentor" ? "accent" : "primary"}
                            size="sm"
                          />
                          <div>
                            <div className={`rounded-2xl px-4 py-2.5 shadow-sm font-body text-xs leading-relaxed ${
                              reply.sender === "mentor"
                                ? "bg-[#0A1931] text-white rounded-tr-none"
                                : "bg-gray-100 text-gray-700 rounded-tl-none"
                            }`}>
                              {reply.content}
                            </div>
                            <span className={`block font-body text-[9px] text-gray-400 mt-1 ${
                              reply.sender === "mentor" ? "text-right" : "text-left"
                            }`}>
                              {reply.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Input Box & Closing Actions */}
              <div className="p-4 border-t border-gray-100 bg-[#F6FAFD]/30">
                <div className="flex gap-2.5 items-stretch">
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-[#4A7FA7]/50 focus-within:bg-white transition-all">
                    <input
                      type="text"
                      placeholder="Type your reply message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                      className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <Paperclip size={14} />
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className={`p-1.5 rounded-lg text-white shadow-md transition-all ${
                          replyText.trim()
                            ? "bg-[#0A1931] hover:bg-[#1A3D63]"
                            : "bg-gray-300 cursor-not-allowed shadow-none"
                        }`}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>

                  {selectedRequest.status === "In Progress" && (
                    <button
                      onClick={() => handleResolve(selectedRequest.id)}
                      className="flex items-center justify-center gap-1.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-body text-xs font-bold shadow-sm transition-all border-none cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      Resolve
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="m-auto text-center py-20 px-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F6FAFD] text-[#4A7FA7] flex items-center justify-center mx-auto border border-gray-50 shadow-sm">
                <MessageSquare size={28} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-heading text-sm font-bold text-[#0A1931]">No Request Selected</h4>
                <p className="font-body text-xs text-gray-400 leading-relaxed">
                  Select a student help request from the list on the left to view details, accept tickets, and send replies.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
