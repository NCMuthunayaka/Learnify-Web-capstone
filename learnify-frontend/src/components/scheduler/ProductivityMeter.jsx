import ProgressBar from '../common/ProgressBar';

const ProductivityMeter = ({ completed = 0, total = 0 }) => {
  const value = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 font-bold text-slate-900">Task Progress</h2>
      <ProgressBar value={value} />
      <p className="mt-3 text-sm text-slate-600">
        {completed} of {total} tasks completed
      </p>
    </div>
  );
};

export default ProductivityMeter;
