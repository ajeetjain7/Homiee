import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const POPULAR_CAPABILITIES = [
  'PPT Making & Pitch Deck',
  'Frontend UI / UX',
  'Backend & APIs',
  'Fullstack Engineering',
  'AI / ML & Deep Learning',
  'System Architecture',
  'Database Management',
  'Research & Documentation',
  'Hardware & IoT',
  'Cybersecurity & Auditing'
];

const SIH_THEMES = [
  'Agriculture & Rural Development',
  'Clean & Renewable Green Technology',
  'Cybersecurity & Disaster Management',
  'Smart Education & Learning',
  'Healthcare & Biomedical Devices',
  'Smart Automation & Robotics',
  'Fintech & Web3 Blockchain',
  'Heritage, Culture & Tourism',
  'Transportation & Logistics',
  'Open Innovation / Miscellaneous'
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Profile = ({ onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {
        _id: 'user_sih_2026',
        name: 'Vikramaditya Rathore',
        email: 'vikram.sih2026@gmail.com',
        college: 'IET DAVV, Indore',
        classBranch: 'B.Tech Computer Science & Engineering',
        section: 'Section B',
        year: '3rd Year',
        yearAndBranch: '3rd Year • Computer Science (Section B)',
        gender: 'Male',
        primaryRole: 'Fullstack Developer',
        capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX', 'Backend & APIs'],
        status: 'Looking for Team',
        technicalSkills: ['React', 'Node.js', 'MongoDB', 'PPT Making', 'Canva'],
        featuredProjects: [],
        sihThemes: ['Agriculture & Rural Development', 'Smart Education & Learning'],
        about: 'Passionate fullstack engineer & pitch presentation designer. Ready to build winning solutions for SIH 2026.',
        github: 'https://github.com/vikram-rathore',
        linkedin: 'https://linkedin.com/in/vikram-rathore',
        portfolio: 'https://vikramaditya.dev',
        leetcodeRating: '1920 (Knight)',
        hackathonsCount: 2,
        isProfileComplete: true
      };
    } catch {
      return { _id: 'user_sih_2026', name: 'Vikramaditya Rathore', email: 'vikram.sih2026@gmail.com' };
    }
  });

  const [form, setForm] = useState(user);
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', link: '', description: '' });

  // Calculate Readiness Percentage dynamically based on profile completeness
  const calculateReadiness = () => {
    let score = 25; // Base score
    if (user.technicalSkills && user.technicalSkills.length >= 3) score += 25;
    if (user.capabilities && user.capabilities.length > 0) score += 15;
    if (user.sihThemes && user.sihThemes.length > 0) score += 15;
    if (user.about && user.about.trim().length > 15) score += 10;
    if (user.github || user.linkedin || user.portfolio) score += 10;
    return Math.min(score, 100);
  };

  const readinessScore = calculateReadiness();

  const handleSaveProfile = async () => {
    try {
      const payload = {
        userId: user._id,
        ...form,
        isProfileComplete: true,
        yearAndBranch: `${form.year || '3rd Year'} • ${form.classBranch || 'Computer Science'}${form.section ? ` (${form.section})` : ''}`
      };

      const res = await axios.put(`${API_BASE}/api/auth/profile`, payload);
      setUser(res.data);
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      if (onUpdateUser) onUpdateUser(res.data);
      setIsEditing(false);
      toast.success('🎉 Profile & Teammate Card updated successfully!');
    } catch (err) {
      console.warn('Backend unavailable, saving locally:', err);
      const updated = {
        ...form,
        isProfileComplete: true,
        yearAndBranch: `${form.year || '3rd Year'} • ${form.classBranch || 'Computer Science'}${form.section ? ` (${form.section})` : ''}`
      };
      setUser(updated);
      localStorage.setItem('userInfo', JSON.stringify(updated));
      if (onUpdateUser) onUpdateUser(updated);
      setIsEditing(false);
      toast.success('Profile saved locally!');
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const updatedSkills = [...(form.technicalSkills || []), newSkill.trim()];
    setForm({ ...form, technicalSkills: updatedSkills });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm({
      ...form,
      technicalSkills: form.technicalSkills.filter(s => s !== skillToRemove)
    });
  };

  const toggleFormCapability = (cap) => {
    const caps = form.capabilities || [];
    const exists = caps.includes(cap);
    const updated = exists ? caps.filter(c => c !== cap) : [...caps, cap];
    setForm({ ...form, capabilities: updated });
  };

  const toggleFormTheme = (theme) => {
    const themes = form.sihThemes || [];
    const exists = themes.includes(theme);
    const updated = exists ? themes.filter(t => t !== theme) : [...themes, theme];
    setForm({ ...form, sihThemes: updated });
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    const updatedProjects = [...(form.featuredProjects || []), newProject];
    setForm({ ...form, featuredProjects: updatedProjects });
    setNewProject({ title: '', link: '', description: '' });
  };

  const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'VR';

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-white select-none">
      
      {/* 1. Header Profile Banner */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 md:p-8 relative shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          
          <div className="flex items-start gap-5">
            {user.photoUrl || user.avatar ? (
              <img
                src={user.photoUrl || user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/50 shadow-lg shadow-amber-500/20"
                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                {userInitials}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user.name}</h1>
                <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-bold px-3 py-1 rounded-md">
                  {user.primaryRole || 'Fullstack Developer'}
                </span>
                {user.gender && (
                  <span className="bg-[#070D18] border border-gray-800 text-gray-300 text-xs font-mono px-2.5 py-1 rounded-md">
                    {user.gender}
                  </span>
                )}
                <span className="bg-[#0E3A2F] border border-[#059669]/40 text-[#34D399] text-xs font-mono font-bold px-3 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                  {user.status || 'Looking for Team'}
                </span>
              </div>

              <p className="text-xs text-gray-300 font-medium">
                🎓 {user.college || 'College / Institute'} • <span className="text-[#38BDF8]">{user.year || '3rd Year'}</span> • {user.classBranch || 'Computer Science'} {user.section ? `(${user.section})` : ''}
              </p>
              <p className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5 mt-1">
                <span>✉️</span> {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setForm(user);
                setIsEditing(true);
              }}
              className="bg-[#17130A] hover:bg-amber-500/20 border border-[#F59E0B]/60 text-[#FBBF24] font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              ✏️ Edit Profile Details
            </button>
          </div>
        </div>

        {/* Top 4 Metrics Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-800/80">
          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#F59E0B]">{user.technicalSkills?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Technical Skills</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#F59E0B]">{user.capabilities?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Capabilities</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#38BDF8]">{user.sihThemes?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">SIH Domains</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#34D399]">{readinessScore}%</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Readiness Score</div>
          </div>
        </div>
      </div>

      {/* 2. SIH Profile Readiness Indicator */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <h3 className="text-sm font-bold text-white tracking-wide">SIH Teammate Readiness</h3>
            <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded">
              {readinessScore}% COMPLETE
            </span>
          </div>
        </div>

        <div className="w-full bg-[#070D18] h-2 rounded-full overflow-hidden border border-gray-800">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        {/* Action Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.technicalSkills?.length >= 3 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.technicalSkills?.length >= 3 ? '✓' : '⏱'}</span>
            <span>3+ Technical Skills</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.capabilities?.length > 0 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.capabilities?.length > 0 ? '✓' : '⏱'}</span>
            <span>PPT / Tech Roles</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.sihThemes?.length > 0 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.sihThemes?.length > 0 ? '✓' : '⏱'}</span>
            <span>SIH Themes Added</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.about?.length > 15 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.about?.length > 15 ? '✓' : '⚪'}</span>
            <span>About Pitch Bio</span>
          </div>
        </div>
      </div>

      {/* 3. Capabilities, About & Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Squad Capabilities Card */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-amber-400 font-mono font-bold">⚡</span>
            <h3 className="text-sm font-bold text-white tracking-wide">Squad Capabilities & Roles</h3>
          </div>

          {user.capabilities && user.capabilities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.capabilities.map((cap, idx) => (
                <span 
                  key={idx} 
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                    cap.includes('PPT')
                      ? 'bg-[#261E0C] border-[#F59E0B] text-[#FBBF24] font-bold'
                      : 'bg-[#070D18] border-gray-700/80 text-gray-200'
                  }`}
                >
                  {cap.includes('PPT') ? '📊 ' : '⚡ '}{cap}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No capabilities selected. Add PPT making, frontend, or backend capabilities.</p>
          )}
        </div>

        {/* About Pitch Card */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-cyan-400 font-mono font-bold">💬</span>
            <h3 className="text-sm font-bold text-white tracking-wide">About & Teammate Pitch</h3>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            {user.about || 'No about section written yet. Describe what makes you a high-value teammate for SIH 2026.'}
          </p>
        </div>

      </div>

      {/* 4. Skills & Credentials Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Skills & Proficiency Card */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-emerald-400 font-mono font-bold">&lt;/&gt;</span>
            <h3 className="text-sm font-bold text-white tracking-wide">Technical & Presentation Skills</h3>
          </div>

          {user.technicalSkills && user.technicalSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.technicalSkills.map((skill, idx) => (
                <span key={idx} className="bg-[#070D18] border border-gray-700/80 text-gray-200 text-xs font-mono px-3 py-1.5 rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No skills added yet.</p>
          )}
        </div>

        {/* Credentials & External Handles */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-purple-400">🔗</span>
            <h3 className="text-sm font-bold text-white tracking-wide">Verified Credentials & Links</h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between bg-[#070D18] p-2.5 rounded-xl border border-gray-800">
              <span className="text-gray-400">🐙 GitHub:</span>
              {user.github ? (
                <a href={user.github} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline truncate max-w-[200px]">{user.github}</a>
              ) : <span className="text-gray-600">Not linked</span>}
            </div>

            <div className="flex items-center justify-between bg-[#070D18] p-2.5 rounded-xl border border-gray-800">
              <span className="text-gray-400">💼 LinkedIn:</span>
              {user.linkedin ? (
                <a href={user.linkedin} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline truncate max-w-[200px]">{user.linkedin}</a>
              ) : <span className="text-gray-600">Not linked</span>}
            </div>

            <div className="flex items-center justify-between bg-[#070D18] p-2.5 rounded-xl border border-gray-800">
              <span className="text-gray-400">🏆 LeetCode / CP Rating:</span>
              <span className="text-emerald-400 font-bold">{user.leetcodeRating || 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Interested SIH Themes Section */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
          <span className="text-rose-400">🎯</span>
          <h3 className="text-sm font-bold text-white tracking-wide">Target SIH Themes</h3>
        </div>

        {user.sihThemes && user.sihThemes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.sihThemes.map((t, idx) => (
              <span key={idx} className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-semibold px-3 py-1.5 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No themes selected yet.</p>
        )}
      </div>

      {/* Edit Profile Full Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0B132B] border border-amber-500/40 p-6 md:p-8 rounded-2xl max-w-2xl w-full space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Full Profile & Teammate Card</h3>
                <p className="text-xs font-mono text-gray-400">Updates will be instantly published to the Find Teammates directory.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">College / Institute</label>
                  <input
                    type="text"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Class / Branch</label>
                  <input
                    type="text"
                    value={form.classBranch}
                    onChange={(e) => setForm({ ...form, classBranch: e.target.value })}
                    placeholder="B.Tech CSE"
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Section</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="Section A"
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Academic Year</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Gender & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Primary Role</label>
                  <select
                    value={form.primaryRole}
                    onChange={(e) => setForm({ ...form, primaryRole: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Fullstack Developer">Fullstack Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="PPT & Presentation Specialist">PPT & Presentation Specialist</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                    <option value="UI / UX Designer">UI / UX Designer</option>
                    <option value="Cybersecurity Specialist">Cybersecurity Specialist</option>
                    <option value="IoT & Hardware Engineer">IoT & Hardware Engineer</option>
                  </select>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-gray-400 mb-1.5 font-bold">Squad Capabilities (Including PPT, Backend, Frontend)</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CAPABILITIES.map(cap => {
                    const active = form.capabilities?.includes(cap);
                    return (
                      <button
                        type="button"
                        key={cap}
                        onClick={() => toggleFormCapability(cap)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
                          active ? 'bg-[#261E0C] border-[#F59E0B] text-[#FBBF24]' : 'bg-[#070D18] border-gray-800 text-gray-400'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{cap}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* About Section */}
              <div>
                <label className="block text-gray-400 mb-1 font-bold">About / Pitch</label>
                <textarea
                  rows={2}
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Technical Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. React, PPT Making, Python..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                  <button type="button" onClick={handleAddSkill} className="bg-amber-500 text-black font-bold px-4 rounded-xl">+ Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {form.technicalSkills?.map((s, i) => (
                    <span key={i} className="bg-[#0E3A2F] text-[#34D399] border border-[#059669]/40 text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                      {s}
                      <button type="button" onClick={() => handleRemoveSkill(s)} className="text-gray-400 hover:text-rose-400">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">GitHub</label>
                  <input
                    type="url"
                    value={form.github}
                    onChange={(e) => setForm({ ...form, github: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">LinkedIn</label>
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">LeetCode / Rating</label>
                  <input
                    type="text"
                    value={form.leetcodeRating}
                    onChange={(e) => setForm({ ...form, leetcodeRating: e.target.value })}
                    placeholder="1850"
                    className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsEditing(false)} className="w-1/2 bg-gray-800 text-gray-300 font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSaveProfile} className="w-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20">Save & Publish Card</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;