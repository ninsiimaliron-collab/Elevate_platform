import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/jobs', label: 'Jobs' },
  { to: '/resources', label: 'Resources' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About' }
];

export default function Shell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === '/auth';

  return (
    <div className="app-shell">
      {!isAuthRoute ? (
        <header className="topbar">
          <div className="brand">
            <img className="brand-logo" src="/favicon.svg" alt="Elevate logo" />
            <div className="brand-text">
              <span className="brand-kicker">Elevate</span>
              <strong>Youth Employment Platform</strong>
            </div>
          </div>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'youth' ? (
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
            ) : null}
            {user?.role === 'employer' ? (
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
            ) : null}
            {user ? (
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Profile
              </NavLink>
            ) : null}
          </nav>

          <div className="auth-section">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button type="button" onClick={logout} className="button-logout">
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/auth" className={({ isActive }) => `button button-nav ${isActive ? 'active' : ''}`}>
                Login / Sign Up
              </NavLink>
            )}
          </div>
        </header>
      ) : null}

      <main className="main-content">
        <Outlet />
      </main>

      {!isAuthRoute ? <Footer /> : null}
    </div>
  );
}
