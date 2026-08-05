const categories = ['All', 'Course', 'App', 'Support'];

const CategoryFilter = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {categories.map((category) => (
      <button
        key={category}
        type="button"
        onClick={() => onChange(category)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
          value === category ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'
        }`}
      >
        {category}
      </button>
    ))}
  </div>
);

export default CategoryFilter;
