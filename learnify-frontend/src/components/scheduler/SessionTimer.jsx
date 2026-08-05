import Button from '../common/Button';
import { useTracking } from '../../hooks/useTracking';

const SessionTimer = () => {
  const { seconds, running, start, pause, reset } = useTracking();
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 font-bold text-slate-900">Focus Timer</h2>
      <p className="mb-4 text-3xl font-bold text-indigo-700">{minutes}:{secs}</p>
      <div className="flex gap-2">
        <Button onClick={running ? pause : start}>{running ? 'Pause' : 'Start'}</Button>
        <Button variant="secondary" onClick={reset}>Reset</Button>
      </div>
    </div>
  );
};

export default SessionTimer;
