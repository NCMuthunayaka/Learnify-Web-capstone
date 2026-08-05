const StatsCard = ({ title, value, note }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    {note && <p className="mt-2 text-sm text-slate-500">{note}</p>}
  </div>
);

export default StatsCard;
