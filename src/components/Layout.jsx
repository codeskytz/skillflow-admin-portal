import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/content', label: 'Content' },
  { to: '/payments', label: 'Payments' },
  { to: '/withdrawals', label: 'Withdrawals' },
  { to: '/levels', label: 'Levels' },
  { to: '/token-packages', label: 'Token Packages' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="layout">
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          ☰
        </button>
        <div className="topbar-brand">
          <img src="/logo.png" alt="Skillflow" className="brand-logo" />
          <span>Skillflow Admin</span>
        </div>
        <div className="topbar-avatar">{user?.name?.charAt(0) || 'A'}</div>
      </header>

      {menuOpen ? <div className="backdrop" onClick={closeMenu} /> : null}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Skillflow" className="brand-logo" />
          <span>Skillflow Admin</span>
          <button className="menu-toggle menu-toggle-close" onClick={closeMenu} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="sidebar-avatar sidebar-avatar-img" />
          ) : (
            <div className="sidebar-avatar">{user?.name?.charAt(0) || 'A'}</div>
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-name">{user?.name}</span>
            <span className="sidebar-email">{user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-small" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
