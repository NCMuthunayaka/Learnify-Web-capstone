import { User, Edit3, Lock, LogOut, ChevronRight, Shield } from "lucide-react"

const MENU = [
  { icon: User,  label: "View Profile",    key: "view"     },
  { icon: Edit3, label: "Edit Profile",    key: "edit"     },
  { icon: Lock,  label: "Change Password", key: "password" },
]

export default function ProfileDropdown({
  user,
  profileImage,
  initials,
  onViewProfile,
  onEditProfile,
  onChangePassword,
  onLogout,
}) {
  const handlers = { view: onViewProfile, edit: onEditProfile, password: onChangePassword }

  return (
    <div
      className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl
        border border-gray-100 z-50 overflow-hidden text-[#0A1931]
        animate-fade-slide-down"
    >

      {/* ── Header gradient banner ── */}
      <div className="bg-gradient-to-br from-[#0A1931] to-[#1A3D63] px-5 py-5">
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden
              ring-2 ring-white/30 shadow-lg">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4A7FA7] to-[#4A7FA7]/60
                  flex items-center justify-center">
                  <span className="font-heading font-bold text-white text-xl">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5
              bg-green-400 rounded-full border-2 border-[#0A1931]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-white text-sm leading-tight truncate">
              {user.name || "Admin User"}
            </p>
            <p className="font-body text-xs text-white/55 mt-0.5 truncate">
              {user.email || "admin@learnify.com"}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5
              bg-white/15 rounded-md font-body text-[10px] font-bold
              text-white/80 uppercase tracking-wider">
              <Shield size={9} />
              {user.role || "admin"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Menu items ── */}
      <div className="py-2 px-2">
        {MENU.map(({ icon: Icon, label, key }) => (
          <button
            key={key}
            onClick={handlers[key]}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-sm font-body font-medium text-gray-600
              hover:bg-gray-50 hover:text-[#0A1931] transition-colors
              text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100
              group-hover:bg-[#EBF3F9] flex items-center justify-center
              transition-colors flex-shrink-0">
              <Icon size={15} className="text-gray-500 group-hover:text-[#4A7FA7] transition-colors" />
            </div>
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* ── Divider + Logout ── */}
      <div className="px-2 pb-2 pt-1 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-body font-medium text-red-500
            hover:bg-red-50 hover:text-red-600 transition-colors
            text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <LogOut size={15} className="text-red-400" />
          </div>
          <span className="flex-1">Logout</span>
        </button>
      </div>

    </div>
  )
}
