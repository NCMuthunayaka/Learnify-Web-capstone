const Tooltip = ({ label, children }) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
      {label}
    </span>
  </span>
);

export default Tooltip;
