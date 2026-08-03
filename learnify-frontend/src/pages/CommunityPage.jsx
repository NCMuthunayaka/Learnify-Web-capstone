import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  Users, MessageSquare, Plus, Search, Filter, Paperclip, Send, 
  ArrowRight, ArrowLeft, CheckCircle2, Clock, FileText, Check, AlertCircle, Sparkles, X, Lock,
  ChevronRight, SortAsc, SortDesc, CalendarDays, User, ThumbsUp, ThumbsDown
} from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import Modal from "../components/common/Modal"
import { 
  getCommunitySummary, getPublicRequests, createPublicRequest, createPublicReply, acceptPublicReply,
  getDirectRequests, createDirectRequest, getDirectThread, sendDirectMessage, escalateToDirect,
  votePublicRequest, votePublicReply
} from "../api/communityApi"
import { getSubjects, createSubject } from "../api/subjectsApi"
import { getAvailableMentors } from "../api/helpRequestsApi"
import { uploadFile } from "../api/resourcesApi"
import { acceptRequest, declineRequest, resolveRequest } from "../api/mentorApi"

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

// Helper to get user_id from JWT token
function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("access_token")
    if (!token) return null
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.sub ? parseInt(payload.sub, 10) : null
  } catch {
    return null
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

// Mock Direct Threads from Fake Users for demonstration
const MOCK_DIRECT_THREADS = [
  {
    id: "mock-thread-1",
    other_user_id: "mock-user-1",
    other_user_name: "Dr. Sarah Jenkins",
    other_user_role: "mentor",
    subject: "Guidance on Binary Search Tree Balancing & AVL Rotations",
    initial_message: "Hello! I reviewed your attempt on the AVL Tree balancing problem. Notice how the height difference exceeds 1 during the right rotation step.",
    status: "in_progress",
    created_at: "2026-08-01T14:30:00Z",
    unread_count: 1,
    messages: [
      {
        id: "m-101",
        sender_id: "mock-user-1",
        sender_name: "Dr. Sarah Jenkins",
        sender_role: "mentor",
        body: "Hello! I reviewed your attempt on the AVL Tree balancing problem. Notice how the height difference exceeds 1 during the right rotation step.",
        created_at: "2026-08-01T14:30:00Z"
      },
      {
        id: "m-102",
        sender_id: "current-user",
        sender_name: "You",
        sender_role: "student",
        body: "Thank you Dr. Sarah! Should I apply a double rotation (LR) when the left subtree is right-heavy?",
        created_at: "2026-08-01T14:35:00Z"
      },
      {
        id: "m-103",
        sender_id: "mock-user-1",
        sender_name: "Dr. Sarah Jenkins",
        sender_role: "mentor",
        body: "Yes, exactly! Perform a left rotation on the left child first, followed by a right rotation on the root node to restore balance.",
        created_at: "2026-08-01T14:40:00Z"
      }
    ]
  },
  {
    id: "mock-thread-2",
    other_user_id: "mock-user-1",
    other_user_name: "Dr. Sarah Jenkins",
    other_user_role: "mentor",
    subject: "Feedback on Graph Dijkstra Algorithm Priority Queue Implementation",
    initial_message: "Your priority queue implementation looks solid, but check line 45 for potential infinite loops when the distance array is not updated properly.",
    status: "resolved",
    created_at: "2026-07-29T10:15:00Z",
    unread_count: 0,
    messages: [
      {
        id: "m-104",
        sender_id: "mock-user-1",
        sender_name: "Dr. Sarah Jenkins",
        sender_role: "mentor",
        body: "Your priority queue implementation looks solid, but check line 45 for potential infinite loops when the distance array is not updated properly.",
        created_at: "2026-07-29T10:15:00Z"
      },
      {
        id: "m-105",
        sender_id: "current-user",
        sender_name: "You",
        sender_role: "student",
        body: "Fixed it by adding the skip condition `if (d > dist[u]) continue`. Thank you!",
        created_at: "2026-07-29T11:00:00Z"
      }
    ]
  },
  {
    id: "mock-thread-3",
    other_user_id: "mock-user-2",
    other_user_name: "Alex Rivera",
    other_user_role: "student",
    subject: "Question on React UseEffect Clean-up Functions & AbortController",
    initial_message: "Hi! Could you explain why a memory leak warning occurs when unmounting a component before async fetch completes?",
    status: "pending",
    created_at: "2026-08-01T18:20:00Z",
    unread_count: 2,
    messages: [
      {
        id: "m-201",
        sender_id: "mock-user-2",
        sender_name: "Alex Rivera",
        sender_role: "student",
        body: "Hi! Could you explain why a memory leak warning occurs when unmounting a component before async fetch completes?",
        created_at: "2026-08-01T18:20:00Z"
      },
      {
        id: "m-202",
        sender_id: "mock-user-2",
        sender_name: "Alex Rivera",
        sender_role: "student",
        body: "Also, is AbortController the best standard practice for cancelling HTTP requests in React 18?",
        created_at: "2026-08-01T18:22:00Z"
      }
    ]
  },
  {
    id: "mock-thread-4",
    other_user_id: "mock-user-2",
    other_user_name: "Alex Rivera",
    other_user_role: "student",
    subject: "State Management: React Context API vs Redux Toolkit Comparison",
    initial_message: "When building medium-scale Learnify modules, should we prefer Redux Toolkit over React Context for performance?",
    status: "in_progress",
    created_at: "2026-07-30T11:00:00Z",
    unread_count: 0,
    messages: [
      {
        id: "m-203",
        sender_id: "mock-user-2",
        sender_name: "Alex Rivera",
        sender_role: "student",
        body: "When building medium-scale Learnify modules, should we prefer Redux Toolkit over React Context for performance?",
        created_at: "2026-07-30T11:00:00Z"
      }
    ]
  },
  {
    id: "mock-thread-5",
    other_user_id: "mock-user-3",
    other_user_name: "Prof. Michael Vance",
    other_user_role: "mentor",
    subject: "Database Normalization (3NF vs BCNF) Schema Examples",
    initial_message: "Here are the sample relational schemas for Boyce-Codd Normal Form. Notice every determinant X -> Y must have X as a candidate key.",
    status: "accepted",
    created_at: "2026-07-31T09:45:00Z",
    unread_count: 1,
    messages: [
      {
        id: "m-301",
        sender_id: "mock-user-3",
        sender_name: "Prof. Michael Vance",
        sender_role: "mentor",
        body: "Here are the sample relational schemas for Boyce-Codd Normal Form. Notice every determinant X -> Y must have X as a candidate key.",
        created_at: "2026-07-31T09:45:00Z"
      }
    ]
  },
  {
    id: "mock-thread-6",
    other_user_id: "mock-user-3",
    other_user_name: "Prof. Michael Vance",
    other_user_role: "mentor",
    subject: "SQL Query Indexing & Optimization for Large Tables",
    initial_message: "Make sure you add composite indexes on (user_id, created_at) to speed up community query execution times by 10x.",
    status: "resolved",
    created_at: "2026-07-25T16:00:00Z",
    unread_count: 0,
    messages: [
      {
        id: "m-302",
        sender_id: "mock-user-3",
        sender_name: "Prof. Michael Vance",
        sender_role: "mentor",
        body: "Make sure you add composite indexes on (user_id, created_at) to speed up community query execution times by 10x.",
        created_at: "2026-07-25T16:00:00Z"
      }
    ]
  },
  {
    id: "mock-thread-7",
    other_user_id: "mock-user-4",
    other_user_name: "Elena Rostova",
    other_user_role: "student",
    subject: "Python Asyncio Event Loop & Task Cancellation Best Practices",
    initial_message: "How do task cancellations work when using asyncio.gather with return_exceptions=True?",
    status: "pending",
    created_at: "2026-08-01T11:10:00Z",
    unread_count: 0,
    messages: [
      {
        id: "m-401",
        sender_id: "mock-user-4",
        sender_name: "Elena Rostova",
        sender_role: "student",
        body: "How do task cancellations work when using asyncio.gather with return_exceptions=True?",
        created_at: "2026-08-01T11:10:00Z"
      }
    ]
  }
]

function CommunityPage() {
  const navigate = useNavigate()
  const currentRole = getRoleFromToken()
  const currentUserId = getUserIdFromToken()
  const isMentor = currentRole === "mentor" || currentRole === "admin"

  async function handleAcceptReply(requestId, replyId) {
    try {
      await acceptPublicReply(requestId, replyId)
      fetchPublicFeed()
      if (activePublicRequest && activePublicRequest.id === requestId) {
        setActivePublicRequest(prev => ({
          ...prev,
          status: "answered",
          replies: prev.replies.map(r => r.id === replyId ? { ...r, is_accepted: true } : { ...r, is_accepted: false })
        }))
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark reply as accepted.")
    }
  }

  // ── Vote on a public question ────────────────────────────
  async function handleVoteQuestion(requestId, voteType) {
    // Optimistic UI update
    setPublicRequests(prev => prev.map(q => {
      if (q.id !== requestId) return q
      const wasMyVote = q.user_vote === voteType
      const prevUp = q.up_votes ?? 0
      const prevDown = q.down_votes ?? 0
      let newUp = prevUp, newDown = prevDown, newUserVote = null
      if (wasMyVote) {
        // Toggle off
        if (voteType === "up") newUp = Math.max(0, prevUp - 1)
        else newDown = Math.max(0, prevDown - 1)
        newUserVote = null
      } else {
        // Switch or new vote
        if (q.user_vote === "up") newUp = Math.max(0, prevUp - 1)
        if (q.user_vote === "down") newDown = Math.max(0, prevDown - 1)
        if (voteType === "up") newUp += 1
        else newDown += 1
        newUserVote = voteType
      }
      return { ...q, up_votes: newUp, down_votes: newDown, vote_score: newUp - newDown, user_vote: newUserVote }
    }))
    if (activePublicRequest && activePublicRequest.id === requestId) {
      setActivePublicRequest(prev => {
        if (!prev) return prev
        const wasMyVote = prev.user_vote === voteType
        const prevUp = prev.up_votes ?? 0
        const prevDown = prev.down_votes ?? 0
        let newUp = prevUp, newDown = prevDown, newUserVote = null
        if (wasMyVote) {
          if (voteType === "up") newUp = Math.max(0, prevUp - 1)
          else newDown = Math.max(0, prevDown - 1)
        } else {
          if (prev.user_vote === "up") newUp = Math.max(0, prevUp - 1)
          if (prev.user_vote === "down") newDown = Math.max(0, prevDown - 1)
          if (voteType === "up") newUp += 1
          else newDown += 1
          newUserVote = voteType
        }
        return { ...prev, up_votes: newUp, down_votes: newDown, vote_score: newUp - newDown, user_vote: newUserVote }
      })
    }
    try {
      await votePublicRequest(requestId, voteType)
    } catch (err) {
      fetchPublicFeed() // Revert on failure
    }
  }

  // ── Vote on a reply ──────────────────────────────────────
  async function handleVoteReply(requestId, replyId, voteType) {
    // Optimistic update on the active detail view
    const updateReplies = (replies) => replies.map(rep => {
      if (rep.id !== replyId) return rep
      const wasMyVote = rep.user_vote === voteType
      const prevUp = rep.up_votes ?? 0
      const prevDown = rep.down_votes ?? 0
      let newUp = prevUp, newDown = prevDown, newUserVote = null
      if (wasMyVote) {
        if (voteType === "up") newUp = Math.max(0, prevUp - 1)
        else newDown = Math.max(0, prevDown - 1)
      } else {
        if (rep.user_vote === "up") newUp = Math.max(0, prevUp - 1)
        if (rep.user_vote === "down") newDown = Math.max(0, prevDown - 1)
        if (voteType === "up") newUp += 1
        else newDown += 1
        newUserVote = voteType
      }
      return { ...rep, up_votes: newUp, down_votes: newDown, vote_score: newUp - newDown, user_vote: newUserVote }
    })
    if (activePublicRequest && activePublicRequest.id === requestId) {
      setActivePublicRequest(prev => prev ? { ...prev, replies: updateReplies(prev.replies) } : prev)
    }
    setPublicRequests(prev => prev.map(q =>
      q.id === requestId ? { ...q, replies: updateReplies(q.replies || []) } : q
    ))
    try {
      await votePublicReply(requestId, replyId, voteType)
    } catch (err) {
      fetchPublicFeed() // Revert on failure
    }
  }

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
  const location = useLocation()
  const [directTab, setDirectTab] = useState(isMentor ? "inbox" : "sent") // mentors: 'inbox'/'sent', students: 'sent'
  const [directThreads, setDirectThreads] = useState([])
  const [directLoading, setDirectLoading] = useState(true)
  const [activeDirectThread, setActiveDirectThread] = useState(null)
  const [directMessages, setDirectMessages] = useState([])
  const [directMessageBody, setDirectMessageBody] = useState("")
  const [directMessageAttachments, setDirectMessageAttachments] = useState([])
  const [sendingDirectMsg, setSendingDirectMsg] = useState(false)
  const [directPriority, setDirectPriority] = useState("Normal")
  const [ticketActionLoading, setTicketActionLoading] = useState(false)

  // Auto switch mainTab to direct if URL contains ?tab=direct
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("tab") === "direct") {
      setMainTab("direct")
    }
  }, [location.search])

  // ── Ticket Action Handlers for Mentors ─────────────────────
  const handleAcceptDirectTicket = async (threadId) => {
    try {
      setTicketActionLoading(true)
      await acceptRequest(threadId)
      fetchDirectFeed()
      if (activeDirectThread) {
        setActiveDirectThread(prev => ({ ...prev, status: "in_progress" }))
      }
    } catch (err) {
      console.error("Accept request error:", err)
    } finally {
      setTicketActionLoading(false)
    }
  }

  const handleDeclineDirectTicket = async (threadId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return
    try {
      setTicketActionLoading(true)
      await declineRequest(threadId)
      fetchDirectFeed()
      if (activeDirectThread?.id === threadId) {
        setActiveDirectThread(null)
      }
    } catch (err) {
      console.error("Decline request error:", err)
    } finally {
      setTicketActionLoading(false)
    }
  }

  const handleResolveDirectTicket = async (threadId) => {
    try {
      setTicketActionLoading(true)
      await resolveRequest(threadId)
      fetchDirectFeed()
      if (activeDirectThread) {
        setActiveDirectThread(prev => ({ ...prev, status: "resolved" }))
      }
    } catch (err) {
      console.error("Resolve request error:", err)
    } finally {
      setTicketActionLoading(false)
    }
  }

  // ── Two-level Direct Requests navigation ──────────────────
  const [selectedSender, setSelectedSender] = useState(null)  // { id, name, role }
  const [directSortBy, setDirectSortBy] = useState("newest")  // 'newest' | 'oldest' | 'unread' | 'status' | 'az' | 'za'
  const [senderSearchQuery, setSenderSearchQuery] = useState("")
  const [cardSearchQuery, setCardSearchQuery] = useState("")

  // ── Modals & Creation Forms ────────────────────────────────
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [newSubjectName, setNewSubjectName]           = useState("")
  const [addingSubject, setAddingSubject]             = useState(false)

  async function handleCreateNewSubject(e) {
    if (e) e.preventDefault()
    if (!newSubjectName.trim()) return
    try {
      setAddingSubject(true)
      const res = await createSubject(newSubjectName.trim())
      const createdSub = res.data
      
      const subRes = await getSubjects()
      const updatedList = subRes.data || []
      setSubjects(updatedList)

      if (createdSub && createdSub.id) {
        setAskSubjectId(createdSub.id.toString())
        setSelectedSubjectFilter(createdSub.id.toString())
      }
      setNewSubjectName("")
      setShowAddSubjectModal(false)
    } catch (err) {
      console.error("Failed to add subject:", err)
    } finally {
      setAddingSubject(false)
    }
  }

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
      const res = await getDirectRequests(directTab).catch(() => null)
      const apiThreads = res?.data?.threads || []
      const combined = [...apiThreads]

      // Merge mock threads from fake users so demonstration functionality is always available
      MOCK_DIRECT_THREADS.forEach(mock => {
        if (!combined.some(t => String(t.id) === String(mock.id))) {
          combined.push(mock)
        }
      })
      setDirectThreads(combined)
    } catch (err) {
      console.error("Failed to load direct requests:", err)
      setDirectThreads(MOCK_DIRECT_THREADS)
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
    // Handle mock thread if threadId starts with 'mock-'
    if (String(threadId).startsWith("mock-")) {
      const targetMock = MOCK_DIRECT_THREADS.find(m => m.id === threadId)
      if (targetMock) {
        targetMock.unread_count = 0
        setActiveDirectThread(targetMock)
        setDirectMessages(targetMock.messages || [])
        setDirectThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread_count: 0 } : t))
        return
      }
    }

    try {
      const res = await getDirectThread(threadId)
      setActiveDirectThread(res.data.thread)
      setDirectMessages(res.data.messages || [])
      fetchDirectFeed() // Refresh badge counts
    } catch (err) {
      console.error("Failed to open direct thread:", err)
    }
  }

  // Poll active direct thread messages if open (skip for mock threads)
  useEffect(() => {
    if (activeDirectThread && !String(activeDirectThread.id).startsWith("mock-")) {
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
        initial_message: directInitialMsg.trim(),
        priority: directPriority
      })
      setDirectSubject("")
      setDirectInitialMsg("")
      setDirectPriority("Normal")
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

    // Handle mock threads demo messaging
    if (String(activeDirectThread.id).startsWith("mock-")) {
      const userMsg = {
        id: `m-user-${Date.now()}`,
        sender_id: "current-user",
        sender_name: "You",
        sender_role: "student",
        body: directMessageBody.trim(),
        attachments: directMessageAttachments,
        created_at: new Date().toISOString()
      }

      const updatedMsgs = [...directMessages, userMsg]
      setDirectMessages(updatedMsgs)

      const targetMock = MOCK_DIRECT_THREADS.find(m => m.id === activeDirectThread.id)
      if (targetMock) targetMock.messages = updatedMsgs

      setDirectMessageBody("")
      setDirectMessageAttachments([])

      // Simulate a live reply from the fake user after 1 second!
      setTimeout(() => {
        const fakeReply = {
          id: `m-reply-${Date.now()}`,
          sender_id: activeDirectThread.other_user_id,
          sender_name: activeDirectThread.other_user_name,
          sender_role: activeDirectThread.other_user_role,
          body: `Thanks for your response regarding "${activeDirectThread.subject}"! I've updated the question card status. Let me know if you have any more questions!`,
          created_at: new Date().toISOString()
        }
        setDirectMessages(prev => [...prev, fakeReply])
        if (targetMock) targetMock.messages = [...(targetMock.messages || []), fakeReply]
      }, 1000)
      return
    }

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

  // ── Unique senders list for the first-level view ──────────
  const uniqueSenders = useMemo(() => {
    const map = new Map()
    directThreads.forEach(t => {
      const key = t.other_user_id ?? t.other_user_name
      if (!map.has(key)) {
        map.set(key, {
          id:    key,
          name:  t.other_user_name,
          role:  t.other_user_role,
          unread: t.unread_count || 0,
          latest: t.created_at,
        })
      } else {
        const existing = map.get(key)
        existing.unread += (t.unread_count || 0)
        if (t.created_at > existing.latest) existing.latest = t.created_at
      }
    })
    let sendersList = Array.from(map.values())
    if (senderSearchQuery.trim()) {
      const q = senderSearchQuery.toLowerCase()
      sendersList = sendersList.filter(s =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.role || "").toLowerCase().includes(q)
      )
    }
    return sendersList.sort((a, b) => new Date(b.latest) - new Date(a.latest))
  }, [directThreads, senderSearchQuery])

  // ── Threads (Question Cards) for the selected sender, with sorting & search ─────────
  const senderThreads = useMemo(() => {
    if (!selectedSender) return []
    let filtered = directThreads.filter(t =>
      (t.other_user_id ?? t.other_user_name) === selectedSender.id
    )

    if (cardSearchQuery.trim()) {
      const q = cardSearchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        (t.subject || "").toLowerCase().includes(q) ||
        (t.initial_message || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
      )
    }

    switch (directSortBy) {
      case "oldest":
        return [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case "unread":
        return [...filtered].sort((a, b) => (b.unread_count || 0) - (a.unread_count || 0) || new Date(b.created_at) - new Date(a.created_at))
      case "status":
        return [...filtered].sort((a, b) => (a.status || "").localeCompare(b.status || ""))
      case "az":
        return [...filtered].sort((a, b) => (a.subject || "").localeCompare(b.subject || ""))
      case "za":
        return [...filtered].sort((a, b) => (b.subject || "").localeCompare(a.subject || ""))
      case "newest":
      default:
        return [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [directThreads, selectedSender, directSortBy, cardSearchQuery])

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
                    <div key={rep.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2 flex flex-row gap-3">
                      {/* Vote Widget for Reply */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => handleVoteReply(activePublicRequest.id, rep.id, "up")}
                          title="Upvote this answer"
                          className={`flex flex-col items-center justify-center w-9 h-9 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            rep.user_vote === "up"
                              ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <span className={`font-heading text-sm font-bold ${
                          (rep.vote_score ?? 0) > 0 ? "text-emerald-600" :
                          (rep.vote_score ?? 0) < 0 ? "text-red-500" : "text-gray-500"
                        }`}>
                          {rep.vote_score ?? 0}
                        </span>
                        <button
                          onClick={() => handleVoteReply(activePublicRequest.id, rep.id, "down")}
                          title="Downvote this answer"
                          className={`flex flex-col items-center justify-center w-9 h-9 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            rep.user_vote === "down"
                              ? "bg-red-50 border-red-400 text-red-600 shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                          }`}
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                      {/* Reply Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={rep.author_name} color={rep.is_mentor ? "primary" : "gray"} size="xs" />
                          <span className="font-heading text-xs font-bold text-[#0A1931]">
                            {rep.author_name} <span className="font-normal text-gray-400">({rep.author_role})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {rep.is_accepted ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-body text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              Accepted Answer (+10 Pts)
                            </span>
                          ) : (
                            activePublicRequest.requester_id === currentUserId && (
                              <button
                                onClick={() => handleAcceptReply(activePublicRequest.id, rep.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-body text-[10px] font-bold px-3 py-1 rounded-full transition-all shadow-xs flex items-center gap-1 border-none cursor-pointer"
                              >
                                <CheckCircle2 size={11} />
                                Accept Answer
                              </button>
                            )
                          )}

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

                      <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {rep.body}
                      </p>

                      {rep.attachments && rep.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
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
                      </div>{/* end Reply Content */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Answer Section (Enforces 1 reply per user limit) */}
            {activePublicRequest.replies?.some(rep => rep.author_id === currentUserId) || activePublicRequest.has_user_replied ? (
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-2xl text-center">
                <p className="font-body text-xs text-gray-600 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  You have already posted an answer to this question. Other community members can contribute their own answers below.
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
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setShowAddSubjectModal(true)
                    } else {
                      setSelectedSubjectFilter(e.target.value)
                    }
                  }}
                  className="bg-[#f8fafc] text-gray-800 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3b719f] cursor-pointer"
                >
                  <option value="">All Course Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-[#3b719f]">➕ Add New Subject...</option>
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
                  <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start gap-4 md:gap-5 hover:bg-gray-50/60 p-3.5 rounded-2xl transition-colors">
                    
                    {/* Left Column Stats (Votes, Answers count, Status) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-start w-full sm:w-28 shrink-0 text-right gap-1.5 text-xs font-body border-b sm:border-b-0 border-gray-100 pb-2 sm:pb-0 pt-0.5">
                      {/* Vote Widget for Question Card */}
                      <div className="flex sm:flex-col items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVoteQuestion(req.id, "up") }}
                          title="Upvote this question"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                            req.user_vote === "up"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600"
                          }`}
                        >
                          <ThumbsUp size={11} />
                          <span>{req.up_votes ?? 0}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVoteQuestion(req.id, "down") }}
                          title="Downvote this question"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                            req.user_vote === "down"
                              ? "bg-red-50 border-red-300 text-red-600"
                              : "bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500"
                          }`}
                        >
                          <ThumbsDown size={11} />
                          <span>{req.down_votes ?? 0}</span>
                        </button>
                      </div>
                      
                      {/* Answers Badge */}
                      <div className={`px-2.5 py-1 rounded-md font-semibold text-xs border transition-colors ${
                        req.replies && req.replies.length > 0
                          ? "border-green-600 text-green-700 bg-green-50 font-bold"
                          : "border-gray-200 text-gray-500 bg-white"
                      }`}>
                        {req.replies ? req.replies.length : 0} {req.replies && req.replies.length === 1 ? "answer" : "answers"}
                      </div>

                      {/* Status Badge */}
                      <div className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                        req.status === "answered"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-50 text-[#3b719f] border border-blue-100/60"
                      }`}>
                        {req.status === "answered" ? "Resolved" : "Open"}
                      </div>
                    </div>

                    {/* Right Content Column */}
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <h3 
                        onClick={() => setActivePublicRequest(req)}
                        className="font-heading text-base font-semibold text-[#0074cc] hover:text-[#005999] hover:underline cursor-pointer leading-snug transition-colors"
                      >
                        {req.title}
                      </h3>

                      <p className="font-body text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      {/* Bottom Bar: Tags & Author Info */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-[#f1f5f9] border border-gray-200 text-gray-700 font-body text-[11px] font-semibold rounded-md">
                            {req.subject_name}
                          </span>
                          {req.attachments && req.attachments.length > 0 && (
                            <span className="text-[11px] text-gray-400 font-body flex items-center gap-1">
                              <Paperclip size={12} /> {req.attachments.length} files
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-body bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
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

            {/* Initial Subject & Ticket Banner */}
            <div className="bg-[#F6FAFD] p-4 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="font-heading text-xs font-bold text-[#0A1931]">
                  Subject: {activeDirectThread.subject}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[10px] font-bold border capitalize ${
                    activeDirectThread.priority?.toLowerCase() === "urgent"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : activeDirectThread.priority?.toLowerCase() === "high"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}>
                    Priority: {activeDirectThread.priority || "Normal"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[10px] font-bold border capitalize ${
                    activeDirectThread.status === "resolved"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : activeDirectThread.status === "accepted" || activeDirectThread.status === "in_progress"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    Status: {activeDirectThread.status === "in_progress" ? "In Progress" : activeDirectThread.status || "Pending"}
                  </span>
                </div>
              </div>

              <p className="font-body text-xs text-gray-600">
                {activeDirectThread.initial_message}
              </p>

              {/* Mentor Actions Bar */}
              {isMentor && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                  {activeDirectThread.status !== "resolved" && (
                    <>
                      {activeDirectThread.status !== "in_progress" && activeDirectThread.status !== "accepted" && (
                        <button
                          type="button"
                          onClick={() => handleAcceptDirectTicket(activeDirectThread.id)}
                          disabled={ticketActionLoading}
                          className="px-3 py-1.5 bg-[#0A1931] hover:bg-[#1A3D63] text-white rounded-xl font-body text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} /> Accept Request
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResolveDirectTicket(activeDirectThread.id)}
                        disabled={ticketActionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-body text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Mark Resolved & Earn Points
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineDirectTicket(activeDirectThread.id)}
                        disabled={ticketActionLoading}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl font-body text-xs font-bold transition-all border border-gray-200 cursor-pointer flex items-center gap-1"
                      >
                        <X size={13} /> Decline
                      </button>
                    </>
                  )}
                </div>
              )}
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
          /* Direct Requests — Two-Level Navigation */
          <div className="space-y-4">
            {/* Mentor Inbox vs Sent Toggle (Hidden for Students) */}
            {isMentor && (
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <button
                  onClick={() => { setDirectTab("inbox"); setSelectedSender(null) }}
                  className={`font-heading text-xs font-bold px-4 py-2 rounded-full border-none cursor-pointer ${
                    directTab === "inbox" ? "bg-[#0A1931] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Inbox (Received)
                </button>
                <button
                  onClick={() => { setDirectTab("sent"); setSelectedSender(null) }}
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

            ) : selectedSender ? (
              /* ── LEVEL 2: Selected Sender's Specific Window (Question Cards) ── */
              <div className="space-y-5">
                {/* Window Header Bar */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedSender(null); setCardSearchQuery(""); setDirectSortBy("newest") }}
                      className="flex items-center gap-1.5 font-body text-xs font-bold text-[#4A7FA7] hover:text-[#1A3D63] bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={15} />
                      Back to Senders
                    </button>
                    <span className="text-gray-300 text-sm">|</span>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={selectedSender.name} color="primary" size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-base font-bold text-[#0A1931]">{selectedSender.name}</h3>
                          <span className="font-body text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1A3D63] border border-blue-100 capitalize">
                            {selectedSender.role}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-gray-400">
                          Direct Question Cards Window
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                      {senderThreads.length} Question Card{senderThreads.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Specific Window Controls: Search & Sorting Panel */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Search inside this sender's question cards */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder={`Search question cards for ${selectedSender.name}...`}
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 font-body text-xs text-gray-800 focus:outline-none focus:border-[#4A7FA7] transition-colors"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    {cardSearchQuery && (
                      <button
                        onClick={() => setCardSearchQuery("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Sorting Option for this specific window */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <SortAsc size={14} className="text-[#3b719f]" /> Sort Cards:
                    </span>
                    {[
                      { key: "newest", label: "Newest" },
                      { key: "oldest", label: "Oldest" },
                      { key: "unread", label: "Unread First" },
                      { key: "status", label: "Status" },
                      { key: "az",     label: "A → Z" },
                      { key: "za",     label: "Z → A" },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setDirectSortBy(opt.key)}
                        className={`font-body text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          directSortBy === opt.key
                            ? "bg-[#0A1931] text-white border-[#0A1931] shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#4A7FA7] hover:text-[#4A7FA7]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Cards Grid */}
                {senderThreads.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-2 shadow-sm">
                    <FileText size={32} className="text-gray-300 mx-auto" />
                    <p className="font-heading text-sm font-semibold text-gray-600">
                      No question cards found matching your filter.
                    </p>
                    <p className="font-body text-xs text-gray-400">
                      Try clearing search queries or switching sorting options.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {senderThreads.map(t => {
                      const isUnread = t.unread_count > 0
                      const status = t.status || "pending"

                      return (
                        <div
                          key={t.id}
                          onClick={() => openDirectThread(t.id)}
                          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4 hover:shadow-lg hover:border-[#4A7FA7]/40 transition-all cursor-pointer relative group"
                        >
                          {/* Top Card Badge & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full font-body text-[10px] font-bold border capitalize ${
                              status === "resolved"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : status === "accepted" || status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {status === "in_progress" ? "In Progress" : status}
                            </span>

                            {isUnread && (
                              <span className="bg-blue-500 text-white font-body text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Unread
                              </span>
                            )}
                          </div>

                          {/* Question Content */}
                          <div className="space-y-1.5 flex-1">
                            <h4 className="font-heading text-sm font-bold text-[#0A1931] line-clamp-2 group-hover:text-[#4A7FA7] transition-colors leading-snug">
                              {t.subject}
                            </h4>
                            <p className="font-body text-xs text-gray-600 line-clamp-3 leading-relaxed">
                              {t.initial_message}
                            </p>
                          </div>

                          {/* Question Card Footer */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                            <span className="flex items-center gap-1.5 font-body">
                              <CalendarDays size={12} className="text-gray-400" />
                              {t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                            </span>
                            <span className="font-heading text-xs font-bold text-[#3b719f] group-hover:text-[#1A3D63] flex items-center gap-1 group-hover:gap-2 transition-all">
                              Open Question Card <ArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            ) : (
              /* ── LEVEL 1: Senders List View ───────────────────────── */
              <div className="space-y-4">
                {/* Search Bar for Senders */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search senders by name or role..."
                      value={senderSearchQuery}
                      onChange={(e) => setSenderSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 font-body text-xs text-gray-800 focus:outline-none focus:border-[#4A7FA7] transition-colors"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    {senderSearchQuery && (
                      <button
                        onClick={() => setSenderSearchQuery("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <p className="font-body text-xs text-gray-400">
                    {uniqueSenders.length} sender{uniqueSenders.length !== 1 ? "s" : ""} — click a name to open their question cards window
                  </p>
                </div>

                {/* Senders List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {uniqueSenders.map(sender => {
                    const senderThreadCount = directThreads.filter(t => (t.other_user_id ?? t.other_user_name) === sender.id).length

                    return (
                      <button
                        key={sender.id}
                        onClick={() => { setSelectedSender(sender); setCardSearchQuery("") }}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50/60 transition-colors text-left group cursor-pointer"
                      >
                        <Avatar name={sender.name} color="primary" size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm font-bold text-[#0A1931] group-hover:text-[#4A7FA7] transition-colors">
                              {sender.name}
                            </span>
                            <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                              {sender.role}
                            </span>
                            {sender.unread > 0 && (
                              <span className="bg-blue-500 text-white font-body text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                {sender.unread} unread
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-gray-400 mt-1">
                            {senderThreadCount} question card{senderThreadCount !== 1 ? "s" : ""} exchanged
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 group-hover:text-[#4A7FA7] transition-colors">
                          <span className="font-body text-xs text-gray-400 group-hover:text-[#4A7FA7]">
                            {sender.latest ? new Date(sender.latest).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                          </span>
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    )
                  })}
                </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block">
                  Course Subject
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="font-body text-[11px] font-bold text-[#3b719f] hover:text-[#1A3D63] flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <Plus size={12} /> Add New Subject
                </button>
              </div>
              <select
                value={askSubjectId}
                onChange={(e) => {
                  if (e.target.value === "__ADD_NEW__") {
                    setShowAddSubjectModal(true)
                  } else {
                    setAskSubjectId(e.target.value)
                  }
                }}
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="__ADD_NEW__" className="font-bold text-[#3b719f]">➕ Add New Subject...</option>
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
                Priority Level
              </label>
              <select
                value={directPriority}
                onChange={(e) => setDirectPriority(e.target.value)}
                className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none cursor-pointer"
              >
                <option value="Normal">Normal Priority</option>
                <option value="High">High Priority ⚠️</option>
                <option value="Urgent">Urgent Priority 🔥</option>
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

      {/* ── MODAL 3: ADD NEW COURSE SUBJECT MODAL ── */}
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
                placeholder="e.g. Embedded Systems, Cloud Computing"
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

export default CommunityPage
