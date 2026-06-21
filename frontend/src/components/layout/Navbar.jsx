import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import GlowButton from '../ui/GlowButton';

const AUTH_LINKS = [
  { label: 'Arena',      to: '/arena' },
  { label: 'Dailies',    to: '/play/daily' },
  { label: 'Compete',    to: '/tournaments' },
  { label: 'Leaderboard', to: '/leaderboard' },
];

const PUBLIC_LINKS = [
  { label: 'Features',    href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Tournaments', to: '/tournaments' },
  { label: 'FAQ',          href: '#faq' },
];

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAnchor = (href) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/70">
      {/* Coins / Streak / XP strip for authenticated users */}
      {isAuthenticated && (
        <div className="border-b border-white/5 px-4 py-1.5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
            {/* Coins */}
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="text-white text-xs font-heading font-bold">{user?.coins ?? 500}</span>
            </div>
            {/* Streak */}
            <div className="flex items-center gap-1.5">
              <span className="text-orange-400 text-sm">🔥</span>
              <span className="text-white text-xs font-heading font-bold">{user?.stats?.currentStreak ?? 0}</span>
            </div>
          </div>
          {/* XP hexagon pill */}
          <div className="flex items-center gap-1.5 bg-accent/15 border border-accent/25 rounded-full px-3 py-0.5">
            <span className="text-accent text-xs">⚡</span>
            <span className="text-accent text-xs font-heading font-bold">{user?.xp ?? 0} XP</span>
          </div>
        </div>
      )}

      <div className="page-container flex items-center justify-between h-14">
        {/* Logo */}
        <Link
          to={isAuthenticated ? '/arena' : '/'}
          className="font-heading font-bold text-xl text-white hover:text-accent transition-colors shrink-0"
        >
          Math<span className="text-accent">Verse</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {AUTH_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-accent hover:bg-white/5 ${
                    location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                      ? 'text-accent bg-accent/5'
                      : 'text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-accent hover:bg-white/5 ${
                    location.pathname.startsWith('/admin') ? 'text-accent bg-accent/5' : 'text-muted'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            PUBLIC_LINKS.map(link =>
              link.href ? (
                <button
                  key={link.label}
                  onClick={() => handleAnchor(link.href)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              )
            )
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={`/profile/${user?.username}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar username={user?.username} src={user?.avatarUrl} size="sm" />
                <span className="text-sm font-medium hidden sm:block">{user?.username}</span>
              </Link>
              <GlowButton variant="ghost" onClick={handleLogout} className="text-sm px-3 py-1.5 hidden sm:block">
                Logout
              </GlowButton>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted hover:text-white transition-colors hidden sm:block">
                Login
              </Link>
              <GlowButton variant="primary" onClick={() => navigate('/register')} className="text-sm px-4 py-2">
                Get Started
              </GlowButton>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted hover:text-white p-2"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/90 px-4 py-4 flex flex-col gap-1">
          {(isAuthenticated ? AUTH_LINKS : PUBLIC_LINKS).map(link =>
            link.href ? (
              <button
                key={link.label}
                onClick={() => { handleAnchor(link.href); setMenuOpen(false); }}
                className="text-left px-4 py-3 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 ${
                  location.pathname === link.to ? 'text-accent' : 'text-muted hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          )}
          {isAuthenticated && (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
