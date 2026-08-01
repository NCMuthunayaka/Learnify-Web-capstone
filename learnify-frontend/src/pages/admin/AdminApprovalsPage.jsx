import { useState, useEffect, useCallback } from "react"
import {
  Clock, UserCheck, CheckCircle2, XCircle,
  FileText, Star, Sparkles,
  ChevronRight, BookOpen, Users, Award,
  AlertTriangle, ArrowRight, Eye, X
} from "lucide-react"
import { getPendingApprovals, approveUser, rejectUser, getAdminStats } from "../../api/adminApi"

const AVATAR_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-green-500",
]

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?"
}

function timeAgo(isoString) {
  if (!isoString) return "Recently"
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Candidate Detail Popup Modal (Matches user screenshot 1:1) ──
function CandidateDetailModal({ candidate, onClose, onApprove, onReject, actioned }) {
  if (!candidate) return null

  const isDone = actioned[candidate.id]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/80">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <span className="font-body text-xs font-bold text-[#3b719f] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Mentor Application Details
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">

          {/* Candidate Card Content */}
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Left Dark Navy Avatar Box */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="w-36 h-40 rounded-2xl bg-[#0A1931] flex flex-col items-center justify-center gap-3 p-4 shadow-md relative">
                <div className="w-16 h-16 rounded-full bg-[#1A3D63] border-2 border-blue-400/30 flex items-center justify-center shadow-inner">
                  <span className="font-heading text-xl font-extrabold text-white">
                    {getInitials(candidate.name)}
                  </span>
                </div>
                <span className="bg-[#3b719f]/40 text-blue-200 font-body text-xs font-bold px-4 py-1 rounded-lg border border-blue-300/20">
                  Mentor
                </span>
              </div>
            </div>

            {/* Candidate Overview Details */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-xl font-extrabold text-[#0A1931]">
                    {candidate.name}
                  </h2>
                  <span className="bg-amber-50 border border-amber-200 text-amber-600 font-body text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    NEW
                  </span>
                </div>
                <p className="font-body text-xs text-slate-500 mt-0.5">{candidate.email}</p>
              </div>

              {/* Two Stat Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] border border-slate-200/60 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="font-body text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <BookOpen size={13} className="text-[#3b719f]" /> EXPERIENCE
                  </span>
                  <span className="font-heading text-lg font-extrabold text-[#0A1931] mt-1">
                    {candidate.experience || "—"}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-slate-200/60 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="font-body text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                    <Award size={13} className="text-[#3b719f]" /> APPLIED
                  </span>
                  <span className="font-heading text-lg font-extrabold text-[#0A1931] mt-1">
                    {timeAgo(candidate.created_at)}
                  </span>
                </div>
              </div>

              {/* Academic Qualifications & Certifications Box */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 space-y-3 font-body">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    ACADEMIC QUALIFICATIONS
                  </span>
                  <p className="text-slate-800 text-xs leading-relaxed font-semibold">
                    {candidate.qualifications || "Not specified"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    CERTIFICATIONS & EXPERIENCE
                  </span>
                  <p className="text-slate-800 text-xs leading-relaxed font-semibold">
                    {candidate.certifications || "Not specified"}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {isDone ? (
              <div className={`w-full text-center py-3 rounded-xl font-body text-xs font-bold ${
                isDone === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}>
                Application {isDone === "approved" ? "Approved & Mentor Activated" : "Rejected"}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onApprove(candidate)}
                  className="flex-1 bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-sm font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <CheckCircle2 size={16} />
                  Approve Candidate
                </button>
                <button
                  onClick={() => onReject(candidate)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-body text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

// ── Confirm Action Modal ──
function ConfirmModal({ action, name, onConfirm, onClose, loading }) {
  const isApprove = action === "approve"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`px-6 py-5 ${isApprove ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isApprove ? "bg-emerald-100" : "bg-red-100"
          }`}>
            {isApprove
              ? <CheckCircle2 size={20} className="text-emerald-600" />
              : <XCircle      size={20} className="text-red-500"  />
            }
          </div>
          <h3 className="font-heading text-base font-bold text-[#0A1931]">
            {isApprove ? "Approve Candidate?" : "Reject Candidate?"}
          </h3>
          <p className="font-body text-sm text-slate-500 mt-1">
            {isApprove
              ? `${name} will be approved and activated as an official Mentor.`
              : `${name}'s mentor application will be rejected.`}
          </p>
        </div>
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-slate-200 text-slate-600 font-body text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors bg-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-white font-body text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer border-none disabled:opacity-50 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Processing…" : (isApprove ? "Approve" : "Reject")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminApprovalsPage() {
  const [users, setUsers]                 = useState([])
  const [stats, setStats]                 = useState(null)
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [confirmModal, setConfirmModal]   = useState(null)
  const [actioned, setActioned]           = useState({})

  const fetchApprovals = useCallback(() => {
    setLoading(true)
    getPendingApprovals()
      .then(res => {
        setUsers(res.data?.users ?? [])
        setTotal(res.data?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchApprovals()
    getAdminStats().then(res => setStats(res.data)).catch(() => {})
  }, [fetchApprovals])

  async function handleConfirm() {
    if (!confirmModal) return
    const { action, userId, name } = confirmModal
    setActionLoading(true)
    try {
      if (action === "approve") await approveUser(userId)
      else                      await rejectUser(userId)
      setActioned(prev => ({ ...prev, [userId]: action === "approve" ? "approved" : "rejected" }))
      fetchApprovals()
    } catch (_) {}
    finally {
      setActionLoading(false)
      setConfirmModal(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-body text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Academic Workspace
          </span>
          <ChevronRight size={11} className="text-slate-300" />
          <span className="font-body text-[10px] text-[#3b719f] uppercase tracking-wider font-semibold">
            Mentor Approvals
          </span>
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-[#0A1931]">User Approvals Queue</h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Review candidate requests below. Click on any application item to open the candidate details popup.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: total?.toString() ?? "0", badge: total > 0 ? "Urgent" : null, badgeBg: "bg-red-50 text-red-600", icon: Clock, iconBg: "bg-orange-50 text-orange-500" },
          { label: "Active Mentors", value: stats?.mentors?.toString() ?? "0", badge: "Active", badgeBg: "bg-emerald-50 text-emerald-600", icon: UserCheck, iconBg: "bg-emerald-50 text-emerald-600" },
          { label: "Total Students", value: stats?.students?.toString() ?? "0", icon: CheckCircle2, iconBg: "bg-blue-50 text-blue-600" },
          { label: "Platform Users", value: stats?.total_users?.toString() ?? "0", dot: true, icon: Users, iconBg: "bg-green-50 text-green-600" },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-body text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{card.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-heading text-xl font-extrabold text-[#0A1931]">{card.value}</span>
                  {card.badge && (
                    <span className={`font-body text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${card.badgeBg}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Approvals List Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        
        {/* Table/List Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-100">
          <div>
            <h3 className="font-heading text-base font-bold text-[#0A1931]">Pending Mentor Applications</h3>
            <p className="font-body text-xs text-slate-500 mt-0.5">Click any request item to view full qualifications & approve</p>
          </div>
          <span className="bg-blue-50 text-[#3b719f] font-body text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
            {total} Pending
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#3b719f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body text-xs text-slate-400 mt-3 font-semibold">Loading mentor applications...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-heading text-base font-bold text-[#0A1931]">All Caught Up!</p>
            <p className="font-body text-xs text-slate-400">There are no pending mentor applications requiring approval at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u, i) => {
              const done = actioned[u.id]
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedCandidate(u)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-all cursor-pointer group"
                >
                  {/* Left Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs font-bold font-heading flex items-center justify-center shrink-0 shadow-xs`}>
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-sm font-bold text-[#0A1931] group-hover:text-[#3b719f] transition-colors">{u.name}</p>
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 font-body text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                          NEW
                        </span>
                      </div>
                      <p className="font-body text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className="font-body text-xs text-slate-400 font-medium hidden sm:inline-block">
                      {timeAgo(u.created_at)}
                    </span>

                    {done ? (
                      <span className={`font-body text-xs font-bold px-3 py-1 rounded-xl uppercase ${
                        done === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                      }`}>
                        {done}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCandidate(u)}
                          className="px-3.5 py-2 bg-blue-50 text-[#3b719f] hover:bg-[#3b719f] hover:text-white rounded-xl font-body text-xs font-bold transition-all border border-blue-100 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={14} /> Review
                        </button>
                        <button
                          onClick={() => setConfirmModal({ action: "approve", userId: u.id, name: u.name })}
                          className="px-3.5 py-2 bg-[#0A1931] hover:bg-[#1A3D63] text-white rounded-xl font-body text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border-none"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setConfirmModal({ action: "reject", userId: u.id, name: u.name })}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-body text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Candidate Popup Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onApprove={c => {
            setSelectedCandidate(null)
            setConfirmModal({ action: "approve", userId: c.id, name: c.name })
          }}
          onReject={c => {
            setSelectedCandidate(null)
            setConfirmModal({ action: "reject", userId: c.id, name: c.name })
          }}
          actioned={actioned}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          action={confirmModal.action}
          name={confirmModal.name}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

    </div>
  )
}
