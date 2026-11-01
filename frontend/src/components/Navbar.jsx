import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/roles';
import UserMenu from './UserMenu';

const LINKS = {
  SUPERADMIN: [{ to: '/superadmin', label: 'User Management' }],
  ADMIN: [
    { to: '/admin', label: 'Publish Study', end: true },
    { to: '/admin/reviews', label: 'Review Submissions' },
  ],
  WORKER: [
    { to: '/worker', label: 'Available Studies', end: true },
    { to: '/worker/submissions', label: 'My Submissions' },
  ],
};

export default function Navbar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to={homePathFor(user.role)} className="navbar__brand">
          DashBoard
        </NavLink>

        <nav className="navbar__links" aria-label="Main">
          {(LINKS[user.role] ?? []).map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className="navbar__link">
              {label}
            </NavLink>
          ))}
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}
