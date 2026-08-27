import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard/browse', label: 'Browse', icon: '🔍' },
    { path: '/dashboard/my-team', label: 'My Team', icon: '👥' },
    { path: '/dashboard/create', label: 'Create', icon: '➕' },
    { path: '/dashboard/requests', label: 'Requests', icon: '🔔' },
    { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <aside className="w-20 lg:w-48 bg-[#0D1021] border-r border-gray-800/80 p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-extrabold flex items-center justify-center text-lg">
            ⚡
          </div>
          <span className="font-bold text-lg hidden lg:inline">Homiee</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;