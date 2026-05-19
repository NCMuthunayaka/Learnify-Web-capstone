import { Filter } from "lucide-react"

const categories = [
  { id: "all", label: "All Feedback", icon: "📋" },
  { id: "bug", label: "Bug Report", icon: "🐛" },
  { id: "feature", label: "Feature Request", icon: "✨" },
  { id: "improvement", label: "Improvement", icon: "📈" },
  { id: "other", label: "Other", icon: "💬" },
]

function CategoryFilter({ selectedCategory = "all", onCategoryChange = null }) {
  if (!onCategoryChange) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />
        <label className="text-sm font-semibold text-slate-700">Filter by Category</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? "bg-sky-100 text-sky-700 border border-sky-300"
                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
            }`}
          >
            <span>{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
