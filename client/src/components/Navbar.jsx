import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CreateTeamModal from './CreateTeamModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = ({ user: propUser, onOpenSetup }) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const localUser = (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const token = localStorage.getItem('token');
  const user = propUser || localUser;
  const isAuthenticated = Boolean(user && (token || user._id));
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'IN';

  // Live polling for unread incoming invitations count
  useEffect(() => {
    if (!isAuthenticated || (!user?._id && !user?.email)) return;

    const fetchCount = async () => {
      try {
        const config = {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { userId: user._id, email: user.email, userName: user.name }
        };
        const res = await axios.get(`${API_BASE}/api/requests/incoming`, config);
        if (Array.isArray(res.data)) {
          setUnreadCount(res.data.length);
        }
      } catch {
        // silent fallback
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [user?._id, user?.email, user?.name, isAuthenticated, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <header className="bg-[#050A14] border-b border-[#1E293B] px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        {/* Left Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <img 
            src="/logo.png" 
            alt="Homiee Logo" 
            className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform" 
          />
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base text-white tracking-tight leading-none">
              Homiee <span className="text-[9px] bg-[#261E0C] border border-[#785412] text-[#FBBF24] px-1 py-0.2 rounded font-mono font-bold uppercase ml-1">SIH</span>
            </span>
            <span className="text-[9px] text-[#94A3B8] font-mono tracking-widest uppercase">Team Formation</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold">
          <NavLink 
            to="/teams" 
            className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-[#CBD5E1] hover:text-white transition-colors'}
          >
            Explore SIH Teams
          </NavLink>
          <NavLink 
            to="/teammates" 
            className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-[#CBD5E1] hover:text-white transition-colors'}
          >
            Find Teammates
          </NavLink>
          <NavLink 
            to="/team" 
            className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-[#CBD5E1] hover:text-white transition-colors'}
          >
            Team
          </NavLink>
          {isAuthenticated && (
            <NavLink 
              to="/requests" 
              className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-[#CBD5E1] hover:text-white transition-colors'}
            >
              Requests
            </NavLink>
          )}
        </nav>

        {/* Right User Bar / Login-Signup Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Prominent Create Team Button in Top-Right */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>+</span> Create Team
              </button>

              {user && !user.isProfileComplete && !user.profileComplete && onOpenSetup && (
                <button
                  onClick={onOpenSetup}
                  className="hidden sm:inline-flex bg-[#17130A] border border-[#F59E0B]/70 text-[#FBBF24] text-xs font-mono font-bold px-3 py-1.5 rounded-xl hover:bg-amber-500/20 cursor-pointer"
                >
                  ⚡ Setup Profile
                </button>
              )}

              <NavLink 
                to="/requests" 
                className="p-2 bg-[#0B132B] border border-[#1E293B] hover:border-[#334155] rounded-xl text-[#CBD5E1] hover:text-white transition-all relative flex items-center justify-center"
                title="Notifications / Requests"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full absolute -top-1 -right-1 shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              <NavLink 
                to="/profile" 
                className="flex items-center gap-2 bg-[#0B132B] border border-[#1E293B] hover:border-[#334155] px-3 py-1.5 rounded-xl transition-all"
              >
                {user?.photoUrl || user?.avatar ? (
                  <img
                    src={user.photoUrl || user.avatar}
                    alt={user?.name || 'Avatar'}
                    className="w-6 h-6 rounded-md object-cover border border-amber-500/50"
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-[#2DD4BF] text-black font-extrabold text-[10px] flex items-center justify-center">
                    {userInitials}
                  </div>
                )}
                <span className="text-xs font-bold text-white max-w-[120px] truncate">{user?.name || 'Innovator'}</span>
                <span className="text-xs text-[#94A3B8]">▾</span>
              </NavLink>

              <button
                onClick={handleLogout}
                title="Log out"
                className="bg-[#0F172A] hover:bg-rose-950/40 border border-[#1E293B] hover:border-rose-700/50 text-[#CBD5E1] hover:text-rose-400 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                ⎋ Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="bg-[#0B132B] hover:bg-[#16223D] border border-[#334155] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Log In
              </Link>
              <Link
                to="/login?mode=signup"
                className="bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10"
              >
                ⚡ Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Global Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};

export default Navbar;