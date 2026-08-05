const ProgressBar = ({ value = 0 }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export default ProgressBar;
