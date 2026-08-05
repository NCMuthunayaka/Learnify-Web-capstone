const toneClasses = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-sky-100 text-sky-700',
};

const Badge = ({ children, tone = 'gray' }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.gray}`}>
    {children}
  </span>
);

export default Badge;
