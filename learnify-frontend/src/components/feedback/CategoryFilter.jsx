import { useState } from "react"
import { Filter, ChevronDown } from "lucide-react"

const CATEGORIES = ["All", "Mentor Quality", "Session Quality", "Platform Issue", "AI Assistant", "General"]

export default function CategoryFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 bg-gray-50 border border-gray-100
          rounded-xl font-body text-xs font-semibold text-gray-600 hover:border-gray-200 transition-colors"
      >
        <Filter size={12} />
        {value === "All" ? "Category" : value}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl
          shadow-lg z-10 py-1 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => { onChange(cat); setOpen(false) }}
              className={`w-full text-left px-4 py-2 font-body text-xs transition-colors
                ${value === cat
                  ? "bg-[#EBF3F9] text-[#1A3D63] font-semibold"
                  : "text-gray-600 hover:bg-gray-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}