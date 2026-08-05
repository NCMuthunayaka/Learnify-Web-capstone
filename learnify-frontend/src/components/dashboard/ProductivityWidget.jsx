import ProgressBar from '../common/ProgressBar';

const ProductivityWidget = ({ value = 65 }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-2 font-bold text-slate-900">Productivity</h2>
    <p className="mb-4 text-sm text-slate-500">Weekly focus score</p>
    <ProgressBar value={value} />
    <p className="mt-3 text-sm font-semibold text-indigo-700">{value}% complete</p>
  </div>
);

export default ProductivityWidget;
