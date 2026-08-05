import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link to="/dashboard" className="font-bold text-slate-900 lg:hidden">
        Learnify
      </Link>
      <div className="hidden text-sm text-slate-500 lg:block">Smart learning workspace</div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">{user?.name || 'Student'}</span>
        <Button variant="secondary" onClick={signOut}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
