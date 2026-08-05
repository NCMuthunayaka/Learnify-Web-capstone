import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/chat', label: 'AI Chat' },
  { to: '/scheduler', label: 'Scheduler' },
  { to: '/resources', label: 'Resources' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/profile', label: 'Profile' },
];

const Sidebar = () => (
  <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
    <div className="mb-8 text-xl font-extrabold text-indigo-700">Learnify</div>
    <nav className="space-y-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
