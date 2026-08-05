import Avatar from '../components/common/Avatar';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar name={user?.name || 'Student'} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Student'}</h1>
          <p className="text-slate-500">{user?.email || 'student@learnify.local'}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Role</p>
          <p className="font-semibold capitalize text-slate-900">{user?.role || 'student'}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Plan</p>
          <p className="font-semibold text-slate-900">Learnify Free</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
