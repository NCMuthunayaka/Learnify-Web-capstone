import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, Clock, UserCheck, Activity,
  Plus, SlidersHorizontal, Edit3, Trash2,
  ChevronLeft, ChevronRight, X, ArrowRight,
  ShieldAlert, UserPlus, Shield, Eye, EyeOff
} from "lucide-react"
import {
  getAllUsers, getAdminStats, updateUserStatus, deleteUser, createUser, updateUserDetails
} from "../../api/adminApi"

const ROLE_COLORS = {
  mentor:  "bg-teal-100 text-teal-700 border-teal-200",
  student: "bg-gray-100 text-gray-600 border-gray-200",
  admin:   "bg-[#0A1931] text-white border-transparent",
}

const STATUS_CONFIG = {
  active:   { dot: "bg-green-500", text: "text-green-600"  },
  pending:  { dot: "bg-amber-400", text: "text-amber-600"  },
  inactive: { dot: "bg-gray-300",  text: "text-gray-500"   },
}

const ROLES    = ["All", "mentor", "student", "admin"]
const STATUSES = ["All", "active", "pending", "inactive"]

const AVATAR_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-green-500",
]

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?"
}

// ── Add User modal (Supports creating Students, Mentors, & Admins) ──
function AddUserModal({ onClose, onSuccess }) {
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "student" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await createUser(form)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-fade-in">
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#0A1931] to-[#1A3D63] text-white">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-blue-300" />
            <h3 className="font-heading text-base font-bold text-white">Create New User / Admin</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="font-body text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 pr-10 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Assign Role *</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
            >
              <option value="student">Student Account</option>
              <option value="mentor">Mentor Account</option>
              <option value="admin">System Administrator 🛡️</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 font-body text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0A1931] hover:bg-[#1A3D63] text-white font-body text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer border-none disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit User Modal (Edit Role, Status, Details) ──
function EditUserModal({ user, onClose, onSuccess }) {
  const [form, setForm]         = useState({ name: user.name || "", email: user.email || "", role: user.role || "student", status: user.status || "active", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.password.trim()) delete payload.password
      await updateUserDetails(user.id, payload)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-fade-in">
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#0A1931] to-[#1A3D63] text-white">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-amber-400" />
            <h3 className="font-heading text-base font-bold text-white">Edit User & Role Settings</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="font-body text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-body text-xs font-semibold text-slate-700">User Role 🛡️</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin 🛡️</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs font-semibold text-slate-700">Account Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
              >
                <option value="active">Active 🟢</option>
                <option value="pending">Pending 🟡</option>
                <option value="inactive">Inactive 🔴</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="font-body text-xs font-semibold text-slate-700">Reset Password (Optional)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank to keep unchanged"
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 pr-10 font-body text-sm text-slate-800 focus:outline-none focus:border-[#3b719f] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 font-body text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1A3D63] hover:bg-[#0A1931] text-white font-body text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer border-none disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Filter panel ──
function FilterPanel({ roleFilter, setRoleFilter, statusFilter, setStatusFilter, onReset }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-5 mt-2 space-y-4
      absolute top-full left-0 z-20 w-72">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-heading text-sm font-bold text-[#0A1931]">Filter Users</h4>
        <button onClick={onReset} className="font-body text-xs text-[#4A7FA7] hover:underline">
          Reset
        </button>
      </div>

      <div className="space-y-2">
        <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">
          Role
        </label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`font-body text-xs px-3 py-1.5 rounded-lg border transition-colors font-semibold capitalize ${
                roleFilter === r
                  ? "bg-[#0A1931] text-white border-[#0A1931]"
                  : "bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-body text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`font-body text-xs px-3 py-1.5 rounded-lg border transition-colors font-semibold capitalize ${
                statusFilter === s
                  ? "bg-[#0A1931] text-white border-[#0A1931]"
                  : "bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()

  const [users,        setUsers]        = useState([])
  const [stats,        setStats]        = useState(null)
  const [page,         setPage]         = useState(1)
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editingUser,  setEditingUser]  = useState(null)
  const [showFilter,   setShowFilter]   = useState(false)
  const [roleFilter,   setRoleFilter]   = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [goToPage,     setGoToPage]     = useState("1")

  const PAGE_SIZE = 10

  const fetchUsers = useCallback(() => {
    setLoading(true)
    getAllUsers(
      page,
      roleFilter   !== "All" ? roleFilter   : null,
      statusFilter !== "All" ? statusFilter : null,
    )
      .then(res => {
        setUsers(res.data?.users      ?? [])
        setTotal(res.data?.total      ?? 0)
        setTotalPages(res.data?.total_pages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, roleFilter, statusFilter])

  useEffect(() => {
    getAdminStats().then(res => setStats(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleStatusChange(userId, status) {
    try {
      await updateUserStatus(userId, status)
      fetchUsers()
    } catch (_) {}
  }

  async function handleDelete(userId) {
    if (!window.confirm("Delete this user? This cannot be undone.")) return
    try {
      await deleteUser(userId)
      fetchUsers()
    } catch (_) {}
  }

  function handleGoToPage(e) {
    e.preventDefault()
    const n = parseInt(goToPage)
    if (n >= 1 && n <= totalPages) setPage(n)
  }

  const startRow = (page - 1) * PAGE_SIZE + 1
  const endRow   = Math.min(page * PAGE_SIZE, total)

  const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 1, totalPages - 2))
    return start + i
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#0A1931]">

      {/* ── 1. Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",      value: stats?.total_users?.toLocaleString() ?? "—", badge: null,
            badgeBg: "bg-blue-50 text-blue-600",
            icon: Users,     iconBg: "bg-blue-50 text-blue-600",
          },
          {
            label: "Pending Approvals", value: stats?.pending_approvals?.toLocaleString() ?? "—",
            badge: (stats?.pending_approvals ?? 0) > 0 ? "Urgent" : null,
            badgeBg: "bg-red-50 text-red-600",
            icon: Clock,     iconBg: "bg-orange-50 text-orange-500",
          },
          {
            label: "Active Mentors",   value: stats?.mentors?.toLocaleString() ?? "—", badge: "Active",
            badgeBg: "bg-teal-50 text-teal-600",
            icon: UserCheck, iconBg: "bg-teal-50 text-teal-600",
          },
          {
            label: "System Health",    value: "99.9%", dot: true,
            icon: Activity,  iconBg: "bg-green-50 text-green-600",
          },
        ].map((card) => {
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

      {/* ── 2. User Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 gap-4 flex-wrap">
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-[#0A1931] hover:bg-[#1A3D63] text-white
                font-body text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={14} />
              ADD USER
            </button>

            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-2 border font-body text-xs font-semibold
                px-4 py-2.5 rounded-xl transition-colors ${
                showFilter
                  ? "bg-[#EBF3F9] border-[#4A7FA7] text-[#1A3D63]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
              }`}
            >
              <SlidersHorizontal size={14} />
              FILTER
              {(roleFilter !== "All" || statusFilter !== "All") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7]" />
              )}
            </button>

            {showFilter && (
              <FilterPanel
                roleFilter={roleFilter}
                setRoleFilter={v => { setRoleFilter(v); setPage(1) }}
                statusFilter={statusFilter}
                setStatusFilter={v => { setStatusFilter(v); setPage(1) }}
                onReset={() => { setRoleFilter("All"); setStatusFilter("All"); setPage(1) }}
              />
            )}
          </div>

          <span className="font-body text-xs text-gray-400 font-semibold ml-auto">
            {loading ? "Loading…" : `Showing ${startRow}–${endRow} of ${total.toLocaleString()}`}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-50">
                  {["User Profile", "Contact", "Role", "Status", "Actions"].map(h => (
                    <th key={h}
                      className="px-6 py-3 text-left font-body text-[10px] text-gray-400
                        uppercase tracking-wider font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center font-body text-sm text-gray-400">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : users.map((u, i) => {
                  const sc = STATUS_CONFIG[u.status] ?? STATUS_CONFIG.inactive
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs
                            font-bold font-heading flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-[#0A1931]">{u.name}</p>
                            <p className="font-body text-[10px] text-gray-400 mt-0.5">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`font-body text-[10px] font-bold px-2.5 py-1 rounded-md border capitalize ${ROLE_COLORS[u.role] ?? ROLE_COLORS.student}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                          <span className={`font-body text-xs font-semibold capitalize ${sc.text}`}>{u.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1A3D63] hover:border-[#1A3D63] transition-colors cursor-pointer"
                            title="Edit User & Change Role"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 size={13} />
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center
                text-gray-500 hover:border-[#4A7FA7] hover:text-[#4A7FA7] disabled:opacity-30
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {visiblePages.map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg border font-body text-xs font-bold transition-colors ${
                  page === n
                    ? "bg-[#0A1931] text-white border-[#0A1931]"
                    : "border-gray-200 text-gray-500 hover:border-[#4A7FA7] hover:text-[#4A7FA7]"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center
                text-gray-500 hover:border-[#4A7FA7] hover:text-[#4A7FA7] disabled:opacity-30
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <form onSubmit={handleGoToPage} className="flex items-center gap-2">
            <span className="font-body text-xs text-gray-400">Go to page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={goToPage}
              onChange={e => setGoToPage(e.target.value)}
              className="w-12 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-body text-xs
                text-gray-700 text-center focus:outline-none focus:border-[#4A7FA7]"
            />
          </form>
        </div>
      </div>

      {/* ── 3. Bottom Insight Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Institutional Insights */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A3D63] to-[#0A1931] text-white p-6 shadow-md">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={18} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold">Institutional Insights</h3>
                <p className="font-body text-sm text-[#B3CFE5] mt-2 leading-relaxed">
                  {stats?.pending_approvals > 0
                    ? `You have ${stats.pending_approvals} pending applications waiting for verification.`
                    : "All mentor applications are up to date."}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/approvals")}
              className="self-start border border-white/30 hover:bg-white/10 text-white font-body
                text-xs font-bold px-4 py-2 rounded-xl transition-colors uppercase tracking-wide"
            >
              Review Pending
            </button>
          </div>
        </div>

        {/* Access Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3F9] flex items-center justify-center flex-shrink-0">
                <Activity size={18} className="text-[#4A7FA7]" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#0A1931]">Access Logs</h3>
            </div>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              Monitor real-time login activity and IP authentication status
              across the campus network.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/system")}
            className="mt-5 self-start flex items-center gap-1.5 font-body text-sm font-bold
              text-[#4A7FA7] hover:text-[#1A3D63] transition-colors"
          >
            View Full Logs <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSuccess={fetchUsers} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchUsers} />}

    </div>
  )
}
