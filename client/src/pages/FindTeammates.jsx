import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TECH_STACK_OPTIONS = [
  'Frontend', 'Backend', 'AI/ML', 'IoT', 'UI/UX', 'Cloud/DevOps', 
  'PPT Making', 'React', 'Node.js', 'Python', 'Docker', 'PyTorch', 'MongoDB', 'Flutter'
];

const COMMON_PS_CODES = [
  'All PS Codes', 'SIH1420', 'SIH1425', 'SIH1430', 'SIH1442', 'SIH1450', 'SIH1462', 'SIH1480', 'SIH1495', 'SIH1510'
];

const FindTeammates = ({ currentUser }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Technical Roles');
  const [selectedCapability, setSelectedCapability] = useState('All Capabilities');
  const [selectedTheme, setSelectedTheme] = useState('All Interested SIH Themes');
  const [selectedYear, setSelectedYear] = useState('All Academic Years');
  const [selectedGender, setSelectedGender] = useState('All Genders');
  const [selectedPsCode, setSelectedPsCode] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const localUser = currentUser || (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const toggleSkillFilter = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const fetchTeammates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: skillSearch,
        role: selectedRole,
        capability: selectedCapability,
        theme: selectedTheme,
        year: selectedYear,
        gender: selectedGender,
        skills: selectedSkills.join(','),
        psCode: selectedPsCode === 'All PS Codes' ? '' : selectedPsCode
      });

      const res = await axios.get(`${API_BASE}/api/auth/teammates?${queryParams.toString()}`);
      const fetchedList = Array.isArray(res.data) ? res.data : [];
      setCandidates(fetchedList);
    } catch (err) {
      console.warn('Could not fetch teammates:', err.message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeammates, 300);
    return () => clearTimeout(timer);
  }, [skillSearch, selectedRole, selectedCapability, selectedTheme, selectedYear, selectedGender, selectedPsCode, selectedSkills, localUser?.profileComplete, localUser?.isProfileComplete]);

  const [mySquads, setMySquads] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Close expanded card on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedCandidate(null);
        setInviteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch logged in user's squads for inviting
  const fetchMySquads = async () => {
    if (!localUser?._id && !localUser?.email) return;
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { userId: localUser?._id, email: localUser?.email, userName: localUser?.name }
      };
      const res = await axios.get(`${API_BASE}/api/teams/team`, config);
      if (res.data?.teams && res.data.teams.length > 0) {
        setMySquads(res.data.teams);
        setSelectedSquadId(res.data.teams[0]._id);
      } else if (res.data?.team) {
        setMySquads([res.data.team]);
        setSelectedSquadId(res.data.team._id);
      }
    } catch {
      // ignore error
    }
  };

  useEffect(() => {
    fetchMySquads();
  }, [localUser?._id, localUser?.email]);

  const handleOpenInvite = (candidate) => {
    if (!localUser) {
      toast.error('Please log in to invite teammates.');
      return;
    }

    if (mySquads.length === 0) {
      toast.error('Please create a squad first via "+ Create Team" to invite teammates.');
      return;
    }

    setSelectedCandidate(candidate);
    setInviteRole(candidate.primaryRole || 'Squad Member');
    setInviteMessage(`Hi ${candidate.name}! We'd love to have your skills on our SIH 2026 squad.`);
    if (!selectedSquadId && mySquads.length > 0) {
      setSelectedSquadId(mySquads[0]._id);
    }
    setInviteModalOpen(true);
  };

  const handleSendInviteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedSquadId) return;

    const targetSquad = mySquads.find(s => s._id === selectedSquadId) || mySquads[0];
    if (!targetSquad) return;

    setSendingInvite(true);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const payload = {
        fromUserId: localUser._id || localUser.id || 'leader_user',
        fromUserName: localUser.name || 'Squad Leader',
        toUserId: selectedCandidate._id,
        toUserName: selectedCandidate.name,
        teamId: targetSquad._id,
        teamName: targetSquad.name,
        psCode: targetSquad.psCode,
        role: inviteRole || selectedCandidate.primaryRole || 'Squad Member',
        type: 'invite',
        message: inviteMessage
      };

      await axios.post(`${API_BASE}/api/requests`, payload, config);

      toast.success(`🎉 Invitation sent to ${selectedCandidate.name} for ${targetSquad.name}!`);
      setInviteModalOpen(false);
      setSelectedCandidate(null);
    } catch (err) {
      console.error('Send invite error:', err);
      toast.error(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#F8FAFC] select-none">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
            ⚡ SIH 2026 TEAMMATE DISCOVERY • {candidates.length} STUDENT INNOVATORS
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Find SIH Teammates</h1>
          <p className="text-xs text-[#CBD5E1]">Discover students by SIH PS code, gender diversity, tech stacks, PPT strengths, and credentials.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/team" 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#000000] font-black text-xs px-5 py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
          >
            ⚡ View My Squad
          </Link>
        </div>
      </div>

      {/* User's Own Live Card Status Banner */}
      {localUser && (localUser.isProfileComplete || localUser.profileComplete) && (
        <div className="bg-[#0E201B] border border-[#059669]/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34D399] text-[#000000] font-black flex items-center justify-center text-sm shadow-md">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#34D399] font-mono">YOUR TEAMMATE CARD IS LIVE IN SIH DIRECTORY</span>
                <span className="bg-[#0E3A2F] text-[#34D399] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#059669]/40">
                  {localUser.sihReadinessScore || 85}% READINESS
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] mt-0.5">
                Squad leaders discover you as <span className="text-white font-black">{localUser.name}</span> ({localUser.primaryRole || 'Fullstack Developer'}) from {localUser.college || 'your institute'}.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-[#070D18] hover:bg-[#0B132B] border border-[#334155] text-xs text-[#F8FAFC] font-mono font-bold px-4 py-2 rounded-xl cursor-pointer transition-all"
          >
            ✏️ Edit Card Info
          </button>
        </div>
      )}

      {/* Search & Filter Controls Matrix */}
      <div className="bg-[#0B132B] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-2xl">
        
        {/* Row 1: Primary Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <input
            type="text"
            placeholder="🔍 Search name, college, skill..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#94A3B8]"
          />

          {/* Filter 1: SIH PS Code (Input or Dropdown) */}
          <input
            type="text"
            placeholder="🎯 PS Code (e.g. SIH1420)..."
            value={selectedPsCode}
            onChange={(e) => setSelectedPsCode(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#94A3B8]"
          />

          {/* Filter 2: Gender Filter (Male / Female / Other / All) */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Genders">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female (SIH Diversity)</option>
            <option value="Other">Other</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Technical Roles">All Roles</option>
            <option value="Fullstack Developer">⚡ Fullstack Developer</option>
            <option value="Frontend Developer">💻 Frontend Developer</option>
            <option value="Backend Developer">⚙️ Backend Developer</option>
            <option value="PPT & Presentation Specialist">📊 PPT Specialist</option>
            <option value="AI / ML Engineer">🤖 AI / ML Engineer</option>
            <option value="UI / UX Designer">🎨 UI / UX Designer</option>
            <option value="Cybersecurity Specialist">🛡️ Cybersecurity</option>
            <option value="IoT & Hardware Engineer">🔌 IoT & Hardware</option>
          </select>

          {/* Academic Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Academic Years">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        {/* Row 2: Multi-Select Tech Stack / Skill Filters */}
        <div className="pt-2 border-t border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#E2E8F0] font-bold uppercase flex items-center gap-1.5">
              <span>⚡</span> Filter by Tech Stack & Skills (Multi-Select):
            </span>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Clear Skills ({selectedSkills.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TECH_STACK_OPTIONS.map((skill) => {
              const active = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkillFilter(skill)}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer font-mono font-medium flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold shadow-md shadow-amber-500/20'
                      : 'bg-[#070D18] border-[#334155] text-[#CBD5E1] hover:border-[#64748B] hover:text-white'
                  }`}
                >
                  <span>{active ? '✓' : '+'}</span>
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Teammates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((c, idx) => {
          const isUserCard = localUser && (localUser._id === c._id || localUser.email === c.email);
          const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'IN';

          return (
            <div
              key={c._id || idx}
              onClick={() => setExpandedCandidate(c)}
              className={`bg-[#0B132B] border rounded-2xl p-6 relative flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl transition-all hover:border-[#F59E0B]/70 hover:shadow-amber-500/10 cursor-pointer group ${
                isUserCard ? 'border-amber-500 shadow-amber-500/10 ring-1 ring-amber-500/30' : 'border-[#1E293B]'
              }`}
            >
              {/* Top Tag Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded">
                    {c.primaryRole || 'Fullstack Developer'}
                  </span>
                  {c.gender && (
                    <span className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-[10px] font-mono px-2 py-0.5 rounded">
                      {c.gender}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isUserCard ? (
                    <span className="bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                      YOU
                    </span>
                  ) : (
                    <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {c.sihReadinessScore || 85}% READINESS
                    </span>
                  )}
                  <span className="text-[10px] text-[#94A3B8] group-hover:text-amber-400 font-mono transition-colors">
                    🔍 Expand
                  </span>
                </div>
              </div>

              {/* Teammate Header Info */}
              <div className="flex items-start gap-3.5">
                {c.photoUrl || c.avatar ? (
                  <img
                    src={c.photoUrl || c.avatar}
                    alt={c.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#F59E0B]/50 shadow-md group-hover:scale-105 transition-transform"
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-base shadow-md group-hover:scale-105 transition-transform">
                    {initials}
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <h3 className="font-black text-white text-base tracking-tight leading-snug group-hover:text-amber-400 transition-colors">{c.name}</h3>
                  <p className="text-xs text-[#E2E8F0] font-medium">
                    🎓 {c.college || 'College / Institute'}
                  </p>
                  <p className="text-[11px] font-mono text-[#CBD5E1]">
                    {c.year || '3rd Year'} • {c.classBranch || 'Computer Science'} {c.section ? `(${c.section})` : ''}
                  </p>
                  {c.email && (
                    <p className="text-[11px] font-mono text-[#F59E0B] font-bold truncate flex items-center gap-1">
                      <span>✉️</span> {c.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Capabilities & Strengths (PPT, Backend, Frontend) */}
              {c.capabilities && c.capabilities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#94A3B8] block uppercase font-bold">CORE CAPABILITIES</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          cap.includes('PPT')
                            ? 'bg-[#261E0C] border-[#F59E0B]/70 text-[#FBBF24] font-bold'
                            : 'bg-[#070D18] border-[#334155] text-[#E2E8F0]'
                        }`}
                      >
                        {cap.includes('PPT') ? '📊 ' : '⚡ '}
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About / Pitch Note */}
              {c.about && (
                <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl text-xs text-[#E2E8F0] leading-relaxed">
                  <span className="text-[10px] font-mono text-[#F59E0B] font-bold block mb-1">💬 ABOUT / PITCH</span>
                  <p className="line-clamp-2">{c.about}</p>
                </div>
              )}

              {/* Technical Skills Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#94A3B8] block uppercase font-bold">VERIFIED SKILLS</span>
                <div className="flex flex-wrap gap-1.5">
                  {(c.technicalSkills || ['React', 'Node.js', 'PPT Making']).slice(0, 6).map((s, i) => (
                    <span key={i} className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-[10px] font-mono px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* External Credentials & CP Ratings */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#1E293B] text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                {c.github && (
                  <a href={c.github} target="_blank" rel="noreferrer" className="text-[#CBD5E1] hover:text-white transition-colors" title="GitHub">
                    🐙 GitHub
                  </a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline" title="LinkedIn">
                    💼 LinkedIn
                  </a>
                )}
                {c.leetcodeRating && c.leetcodeRating !== 'N/A' && (
                  <span className="text-amber-400 font-bold" title="LeetCode Rating">
                    🏆 {c.leetcodeRating}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <div onClick={(e) => e.stopPropagation()}>
                {isUserCard ? (
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="w-full bg-[#17130A] border border-[#F59E0B]/70 hover:border-[#F59E0B] text-[#FBBF24] font-mono font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    ⚙️ Manage Your Teammate Card
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenInvite(c)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#000000] font-black text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    ⚡ Invite to Squad
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EXPANDED LARGE PROFILE CARD MODAL */}
      {expandedCandidate && (() => {
        const isSelf = localUser && (localUser._id === expandedCandidate._id || localUser.email === expandedCandidate.email);
        const expInitials = expandedCandidate.name ? expandedCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'IN';

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setExpandedCandidate(null)}
          >
            <div 
              className="bg-[#0B132B] border border-[#F59E0B]/60 rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Banner Gradient */}
              <div className="h-24 bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-amber-500/10 border-b border-[#1E293B] relative flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <span className="bg-[#17130A] border border-[#F59E0B] text-[#FBBF24] text-xs font-mono font-bold px-3 py-1 rounded-xl">
                    ⚡ {expandedCandidate.primaryRole || 'Fullstack Developer'}
                  </span>
                  {expandedCandidate.gender && (
                    <span className="bg-[#070D18] border border-[#334155] text-[#CBD5E1] text-xs font-mono px-2.5 py-1 rounded-xl">
                      {expandedCandidate.gender}
                    </span>
                  )}
                  {expandedCandidate.sihReadinessScore && (
                    <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] text-xs font-mono font-bold px-2.5 py-1 rounded-xl">
                      {expandedCandidate.sihReadinessScore}% READINESS
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setExpandedCandidate(null)}
                  className="w-9 h-9 rounded-full bg-[#070D18]/80 hover:bg-[#1E293B] border border-[#334155] text-white flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Profile Main Body */}
              <div className="p-6 md:p-8 space-y-6 -mt-10">
                {/* Avatar + Main Name & Academic Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  {expandedCandidate.photoUrl || expandedCandidate.avatar ? (
                    <img
                      src={expandedCandidate.photoUrl || expandedCandidate.avatar}
                      alt={expandedCandidate.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-xl bg-[#070D18]"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-2xl shadow-xl border-2 border-amber-400">
                      {expInitials}
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-white tracking-tight">{expandedCandidate.name}</h2>
                      {isSelf && (
                        <span className="bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#E2E8F0] font-medium">
                      🎓 {expandedCandidate.college || 'College / Institute'}
                    </p>
                    <p className="text-xs font-mono text-[#CBD5E1]">
                      {expandedCandidate.year || '3rd Year'} • {expandedCandidate.classBranch || 'Computer Science'} {expandedCandidate.section ? `(${expandedCandidate.section})` : ''}
                    </p>
                  </div>
                </div>

                {/* Contact Coordinates (High Contrast) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#070D18] border border-[#1E293B] p-4 rounded-2xl">
                  {expandedCandidate.email && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-400">✉️</span>
                      <span className="text-[#CBD5E1] truncate select-all">{expandedCandidate.email}</span>
                    </div>
                  )}
                  {expandedCandidate.whatsappNumber && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#34D399]">
                      <span>📱</span>
                      <a 
                        href={`https://wa.me/${expandedCandidate.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:underline font-bold"
                      >
                        WhatsApp: {expandedCandidate.whatsappNumber}
                      </a>
                    </div>
                  )}
                </div>

                {/* About / Pitch Statement */}
                {expandedCandidate.about && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#F59E0B] font-bold uppercase tracking-wider block">
                      💬 ABOUT & HACKATHON PITCH
                    </span>
                    <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed bg-[#070D18] border border-[#1E293B] p-4 rounded-2xl">
                      {expandedCandidate.about}
                    </p>
                  </div>
                )}

                {/* Core Capabilities */}
                {expandedCandidate.capabilities && expandedCandidate.capabilities.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#94A3B8] font-bold uppercase tracking-wider block">
                      ⚡ CORE CAPABILITIES & STRENGTHS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {expandedCandidate.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className={`text-xs font-mono px-3 py-1 rounded-xl border ${
                            cap.includes('PPT')
                              ? 'bg-[#261E0C] border-[#F59E0B] text-[#FBBF24] font-bold'
                              : 'bg-[#070D18] border-[#334155] text-[#E2E8F0]'
                          }`}
                        >
                          {cap.includes('PPT') ? '📊 ' : '⚡ '}
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {expandedCandidate.technicalSkills && expandedCandidate.technicalSkills.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#94A3B8] font-bold uppercase tracking-wider block">
                      🛠️ VERIFIED TECHNICAL SKILLS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {expandedCandidate.technicalSkills.map((s, i) => (
                        <span key={i} className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-xs font-mono px-3 py-1 rounded-xl">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIH Themes of Interest */}
                {expandedCandidate.sihThemes && expandedCandidate.sihThemes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#94A3B8] font-bold uppercase tracking-wider block">
                      🎯 INTERESTED SIH THEMES
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {expandedCandidate.sihThemes.map((th, i) => (
                        <span key={i} className="bg-[#102A45] border border-[#0284C7]/60 text-[#38BDF8] text-xs font-mono px-3 py-1 rounded-xl">
                          🏛️ {th}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Handles & Ratings */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#1E293B] text-xs font-mono">
                  {expandedCandidate.github && (
                    <a href={expandedCandidate.github} target="_blank" rel="noreferrer" className="text-[#CBD5E1] hover:text-white flex items-center gap-1.5 transition-colors">
                      <span>🐙</span> GitHub Profile
                    </a>
                  )}
                  {expandedCandidate.linkedin && (
                    <a href={expandedCandidate.linkedin} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline flex items-center gap-1.5">
                      <span>💼</span> LinkedIn Profile
                    </a>
                  )}
                  {expandedCandidate.portfolio && (
                    <a href={expandedCandidate.portfolio} target="_blank" rel="noreferrer" className="text-[#34D399] hover:underline flex items-center gap-1.5">
                      <span>🌐</span> Portfolio Website
                    </a>
                  )}
                  {expandedCandidate.leetcodeRating && expandedCandidate.leetcodeRating !== 'N/A' && (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <span>🏆</span> LeetCode: {expandedCandidate.leetcodeRating}
                    </span>
                  )}
                </div>

                {/* Primary Action Button inside Expanded Card */}
                <div className="pt-2">
                  {isSelf ? (
                    <button
                      onClick={() => window.location.href = '/profile'}
                      className="w-full bg-[#17130A] hover:bg-[#261E0C] border border-[#F59E0B] text-[#FBBF24] font-mono font-bold text-sm py-3 rounded-2xl cursor-pointer transition-all shadow-lg"
                    >
                      ⚙️ Edit Your Profile Information
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const target = expandedCandidate;
                        setExpandedCandidate(null);
                        handleOpenInvite(target);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-sm py-3.5 rounded-2xl cursor-pointer transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      ⚡ Invite {expandedCandidate.name} to Squad
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Invite To Squad Modal Popup */}
      {inviteModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B132B] border border-[#F59E0B]/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-base text-white">Invite {selectedCandidate.name}</h3>
              </div>
              <button 
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Select Your Target Squad *</label>
                <select
                  value={selectedSquadId}
                  onChange={(e) => setSelectedSquadId(e.target.value)}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  {mySquads.map(sq => (
                    <option key={sq._id} value={sq._id}>
                      {sq.name} ({sq.psCode || 'SIH2026'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Assigned Squad Role</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="e.g. AI / ML Engineer, Backend Developer"
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Invitation Pitch Message</label>
                <textarea
                  rows="3"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="bg-[#070D18] border border-gray-700 text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black px-5 py-2 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {sendingInvite ? 'Sending...' : '⚡ Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {candidates.length === 0 && !loading && (
        <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl p-12 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-white">No teammates matched your filters</h3>
          <p className="text-xs text-[#CBD5E1]">Try adjusting your PS code, gender, skills, or role filters.</p>
          <button
            onClick={() => {
              setSkillSearch('');
              setSelectedRole('All Technical Roles');
              setSelectedCapability('All Capabilities');
              setSelectedTheme('All Interested SIH Themes');
              setSelectedYear('All Academic Years');
              setSelectedGender('All Genders');
              setSelectedPsCode('');
              setSelectedSkills([]);
            }}
            className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-xs font-mono px-4 py-2 rounded-xl text-white cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default FindTeammates;