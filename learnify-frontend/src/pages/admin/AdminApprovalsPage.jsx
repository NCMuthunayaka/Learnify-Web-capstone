import { useState, useEffect, useCallback } from "react"
import {
  Clock, UserCheck, CheckCircle2, XCircle,
  FileText, Star, Sparkles,
  ChevronRight, BookOpen, Users, Award,
  AlertTriangle, ArrowRight
} from "lucide-react"
import { getPendingApprovals, approveUser, rejectUser, getAdminStats } from "../../api/adminApi"

const AVATAR_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-green-500",
]

function getInitials(name) {
  return name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"
}

function timeAgo(isoString) {
  if (!isoString) return ""
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Confirm modal ──
function ConfirmModal({ action, name, onConfirm, onClose, loading }) {
  const isApprove = action === "approve"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className={`px-6 py-5 ${isApprove ? "bg-teal-50" : "bg-red-50"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isApprove ? "bg-teal-100" : "bg-red-100"
          }`}>
            {isApprove
              ? <CheckCircle2 size={20} className="text-teal-600" />
              : <XCircle      size={20} className="text-red-500"  />
            }
          </div>
          <h3 className="font-heading text-base font-bold text-[#0A1931]">
            {isApprove ? "Approve Candidate?" : "Reject Candidate?"}
          </h3>
          <p className="font-body text-sm text-gray-500 mt-1">
            {isApprove
              ? `${name} will be approved and activated.`
              : `${name}'s application will be rejected.`}
          </p>
        </div>
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 font-body text-sm font-semibold
              py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-white font-body text-sm font-semibold py-2.5 rounded-xl
              transition-colors shadow-sm disabled:opacity-50 ${
              isApprove
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-red-500 hover:bg-red-600"
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
  const [users,        setUsers]        = useState([])
  const [stats,        setStats]        = useState(null)
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // { action, userId, name }
  const [actioned,     setActioned]     = useState({})  // { [id]: "approved" | "rejected" }

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

  const featured   = users[0] ?? null
  const otherUsers = users.slice(1)

  const featuredActioned = featured ? actioned[featured.id] : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── Breadcrumb & Heading ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            Academic Workspace
          </span>
          <ChevronRight size={11} className="text-gray-300" />
          <span className="font-body text-[10px] text-[#4A7FA7] uppercase tracking-wider font-semibold">
            Mentor Approvals
          </span>
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-[#0A1931]">Pending Applications</h1>
        <p className="font-body text-sm text-gray-500 mt-1">
          Review and verify candidates applying for mentorship. Ensure all credentials align with institutional standards.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Review",   value: total?.toString() ?? "—", badge: total > 0 ? "Urgent" : null,
            badgeBg: "bg-red-50 text-red-600",
            icon: Clock,      iconBg: "bg-orange-50 text-orange-500",
          },
          {
            label: "Active Mentors",   value: stats?.mentors?.toString() ?? "—", badge: "Active",
            badgeBg: "bg-teal-50 text-teal-600",
            icon: UserCheck,  iconBg: "bg-teal-50 text-teal-600",
          },
          {
            label: "Total Students",   value: stats?.students?.toString() ?? "—", badge: null, dot: false,
            icon: CheckCircle2, iconBg: "bg-blue-50 text-blue-600",
          },
          {
            label: "Platform Users",   value: stats?.total_users?.toString() ?? "—", dot: true,
            icon: Users,      iconBg: "bg-green-50 text-green-600",
          },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
                flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {card.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-heading text-xl font-extrabold text-[#0A1931]">{card.value}</span>
                  {card.badge && (
                    <span className={`font-body text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${card.badgeBg}`}>
                      {card.badge}
                    </span>
                  )}
                  {card.dot && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !featured ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <CheckCircle2 size={40} className="mx-auto text-teal-400 mb-3" />
          <p className="font-heading text-base font-bold text-[#0A1931]">All caught up!</p>
          <p className="font-body text-sm text-gray-400 mt-1">There are no pending applications right now.</p>
        </div>
      ) : (
        <>
          {/* ── Main Content Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Featured Candidate Card ── */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

              {featuredActioned && (
                <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold font-body ${
                  featuredActioned === "approved" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"
                }`}>
                  {featuredActioned === "approved"
                    ? <><CheckCircle2 size={16} /> {featured.name} has been approved.</>
                    : <><XCircle      size={16} /> {featured.name}'s application has been rejected.</>
                  }
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6">

                {/* Avatar visual */}
                <div className="flex-shrink-0">
                  <div className="w-36 h-40 rounded-2xl bg-gradient-to-br from-[#1A3D63] to-[#0A1931]
                    flex flex-col items-center justify-end pb-4 shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#4A7FA7] border-2 border-white/30
                          flex items-center justify-center">
                          <span className="font-heading text-xl font-extrabold text-white">
                            {getInitials(featured.name)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 bg-[#4A7FA7] rounded-lg px-3 py-1 relative z-10">
                      <span className="font-body text-[9px] text-white font-bold uppercase tracking-wide capitalize">
                        {featured.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-heading text-lg font-extrabold text-[#0A1931]">
                        {featured.name}
                      </h2>
                      <span className="flex items-center gap-1 bg-amber-50 border border-amber-200
                        text-amber-600 font-body text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                        <Star size={9} className="fill-amber-400 stroke-amber-400" />
                        NEW
                      </span>
                    </div>
                    <p className="font-body text-xs text-gray-500 mt-0.5">{featured.email}</p>
                    {featured.university && (
                      <p className="font-body text-xs text-gray-400 mt-0.5">{featured.university}</p>
                    )}
                  </div>

                  {featured.bio && (
                    <p className="font-body text-sm text-gray-600 mt-3 leading-relaxed">{featured.bio}</p>
                  )}

                  {/* Fields */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featured.department && (
                      <span className="font-body text-xs font-semibold px-3 py-1 rounded-lg
                        bg-[#EBF3F9] text-[#1A3D63] border border-[#B3CFE5]">
                        {featured.department}
                      </span>
                    )}
                    {featured.subject && (
                      <span className="font-body text-xs font-semibold px-3 py-1 rounded-lg
                        bg-[#EBF3F9] text-[#1A3D63] border border-[#B3CFE5]">
                        {featured.subject}
                      </span>
                    )}
                    {featured.faculty && (
                      <span className="font-body text-xs font-semibold px-3 py-1 rounded-lg
                        bg-[#EBF3F9] text-[#1A3D63] border border-[#B3CFE5]">
                        {featured.faculty}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-[#4A7FA7]" />
                        <span className="font-body text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                          Experience
                        </span>
                      </div>
                      <span className="font-heading text-base font-extrabold text-[#0A1931]">
                        {featured.experience ?? "—"}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-[#4A7FA7]" />
                        <span className="font-body text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                          Applied
                        </span>
                      </div>
                      <span className="font-heading text-base font-extrabold text-[#0A1931]">
                        {timeAgo(featured.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => !featuredActioned && setConfirmModal({ action: "approve", userId: featured.id, name: featured.name })}
                  disabled={!!featuredActioned}
                  className={`flex items-center gap-2 font-body text-sm font-bold px-5 py-2.5 rounded-xl
                    transition-colors shadow-sm ${
                    featuredActioned
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#0A1931] hover:bg-[#1A3D63] text-white"
                  }`}
                >
                  <CheckCircle2 size={15} />
                  Approve Candidate
                </button>
                <button
                  onClick={() => !featuredActioned && setConfirmModal({ action: "reject", userId: featured.id, name: featured.name })}
                  disabled={!!featuredActioned}
                  className={`flex items-center gap-2 font-body text-sm font-bold px-5 py-2.5 rounded-xl
                    border transition-colors ${
                    featuredActioned
                      ? "border-gray-100 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
                  }`}
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            </div>

            {/* ── AI Recommended Panel (static) ── */}
            <div className="bg-gradient-to-b from-[#0A1931] to-[#1A3D63] rounded-2xl p-6 text-white
              shadow-md flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 relative z-10">
                <Sparkles size={15} className="text-amber-300" />
                <h3 className="font-heading text-sm font-bold text-white">Queue Summary</h3>
              </div>

              <p className="font-body text-xs text-[#B3CFE5] leading-relaxed relative z-10">
                {total > 1
                  ? `There are ${total} applications waiting for review. The oldest has been pending for some time — prioritize soon.`
                  : "Only one application is pending. Review it to keep approvals up to date."}
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 relative z-10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
                    <p className="font-body text-[9px] uppercase tracking-wider text-[#B3CFE5] font-semibold">
                      Pending
                    </p>
                    <p className="font-heading text-2xl font-extrabold text-white mt-0.5">{total}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
                    <p className="font-body text-[9px] uppercase tracking-wider text-[#B3CFE5] font-semibold">
                      Role
                    </p>
                    <p className="font-heading text-sm font-extrabold text-amber-300 mt-1 capitalize">
                      {featured?.role ?? "Mixed"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#4A7FA7] mt-1.5 flex-shrink-0" />
                  <p className="font-body text-xs text-[#B3CFE5]">Approve only verified applicants</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#4A7FA7] mt-1.5 flex-shrink-0" />
                  <p className="font-body text-xs text-[#B3CFE5]">Rejected users are set to inactive</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Other Pending Applicants ── */}
          {otherUsers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="font-heading text-base font-bold text-[#0A1931]">
                  Other Pending Applicants
                </h3>
                <span className="font-body text-[10px] font-bold px-2.5 py-1 rounded-lg
                  bg-gray-100 text-gray-500 uppercase tracking-wide">
                  {otherUsers.length} more
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {otherUsers.map((u, i) => {
                  const done = actioned[u.id]
                  return (
                    <div key={u.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length]} text-white text-xs
                          font-bold font-heading flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-[#0A1931]">{u.name}</p>
                          <p className="font-body text-xs text-gray-400 mt-0.5">
                            Applied {timeAgo(u.created_at)} · {u.role}
                            {u.department ? ` · ${u.department}` : ""}
                          </p>
                        </div>
                      </div>
                      {done ? (
                        <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          done === "approved"
                            ? "bg-teal-50 text-teal-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {done}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmModal({ action: "approve", userId: u.id, name: u.name })}
                            className="font-body text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => setConfirmModal({ action: "reject", userId: u.id, name: u.name })}
                            className="font-body text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Warning Notice ── */}
      {total > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-700">
              {total} application{total !== 1 ? "s are" : " is"} awaiting review.
            </p>
            <p className="font-body text-xs text-amber-600 mt-0.5">
              Delayed reviews may impact mentor onboarding timelines for the next cohort.
            </p>
          </div>
        </div>
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
