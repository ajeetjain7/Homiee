import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'VR';

  return (
    <header className="bg-[#050A14] border-b border-gray-800/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
      {/* Left Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-black font-extrabold flex items-center justify-center text-lg shadow-lg shadow-amber-500/10">
          ⚡
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base text-white tracking-tight leading-none">
            Homiee <span className="text-[9px] bg-[#261E0C] border border-[#785412] text-[#FBBF24] px-1 py-0.2 rounded font-mono font-bold uppercase ml-1">SIH</span>
          </span>
          <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Team Formation</span>
        </div>
      </div>

      {/* Center Nav Links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-semibold">
        <NavLink 
          to="/dashboard/browse" 
          className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-gray-400 hover:text-white transition-colors'}
        >
          Explore SIH Teams
        </NavLink>
        <NavLink 
          to="/dashboard/teammates" 
          className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-gray-400 hover:text-white transition-colors'}
        >
          Find Teammates
        </NavLink>
        <NavLink 
          to="/dashboard/create" 
          className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-gray-400 hover:text-white transition-colors'}
        >
          Form Your Team
        </NavLink>
        <NavLink 
          to="/dashboard/requests" 
          className={({ isActive }) => isActive ? 'text-[#FBBF24] font-bold border-b-2 border-[#FBBF24] pb-1' : 'text-gray-400 hover:text-white transition-colors'}
        >
          Requests
        </NavLink>
      </nav>

      {/* Right User Profile Bar */}
      <div className="flex items-center gap-3">
        <NavLink to="/dashboard/requests" className="p-2 bg-[#0B132B] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all relative">
          🔔
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
        </NavLink>

        <NavLink to="/dashboard/profile" className="flex items-center gap-2 bg-[#0B132B] border border-gray-800 hover:border-gray-700 px-3 py-1.5 rounded-xl transition-all">
          <div className="w-6 h-6 rounded-md bg-[#2DD4BF] text-black font-extrabold text-[10px] flex items-center justify-center">
            {userInitials}
          </div>
          <span className="text-xs font-bold text-white max-w-[120px] truncate">{user.name || 'Vikramaditya Rathore'}</span>
          <span className="text-xs text-gray-500">▾</span>
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;