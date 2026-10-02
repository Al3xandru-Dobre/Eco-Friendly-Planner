import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../lib/format';
import { Leaf, Menu, Moon, Sun, X } from './Icons';

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('efp.theme') || 'auto'; } catch { return 'auto'; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    try { localStorage.setItem('efp.theme', theme); } catch { /* ignore */ }
  }, [theme]);
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      <header className="nav">
        <div className="container">
          <Link to="/" className="brand"><span className="brand-mark"><Leaf width={20} height={20} /></span><span className="brand-text">Eco-Friendly Planner</span></Link>
          <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Primary">
            <NavLink to="/explore">Explore</NavLink>
            {user && <NavLink to="/trips">My trips</NavLink>}
            {user && <NavLink to="/bookings">Bookings</NavLink>}
            {!user && <NavLink to="/login">Sign in</NavLink>}
            {!user && <NavLink to="/register">Create account</NavLink>}
            {user && <div className="menu-only"><button type="button" className="btn btn-sm btn-ghost" onClick={() => { logout(); navigate('/'); }}>Sign out</button></div>}
          </nav>
          <div className="nav-right">
            <button type="button" className="btn btn-icon btn-ghost" onClick={toggle} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>{isDark ? <Sun /> : <Moon />}</button>
            {user ? (
              <>
                <span className="avatar" title={user.email}>{initials(user.name)}</span>
                <span className="small user-name">{user.name}</span>
                <button type="button" className="btn btn-sm btn-ghost desktop-only" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
              </>
            ) : (
              <Link to="/register" className="btn btn-primary btn-sm desktop-only">Get started</Link>
            )}
            <button type="button" className="btn btn-icon btn-ghost nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <span>Eco-Friendly Planner · GPL-3.0</span>
          <span>Venue catalogue is illustrative sample data. Carbon figures use indicative factors.</span>
        </div>
      </footer>
    </>
  );
}
