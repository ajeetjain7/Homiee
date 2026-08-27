import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BrowseTeams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [psCodeFilter, setPsCodeFilter] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All Themes');
  const [selectedRole, setSelectedRole] = useState('All Open Positions');
  const [selectedSkill, setSelectedSkill] = useState('All Skills');
  
  const [selectedTeamForRequest, setSelectedTeamForRequest] = useState(null);
  const [pitchNote, setPitchNote] = useState('');

  const user = (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const themes = ['All Themes', 'Agriculture & Rural Dev', 'Clean & Green Tech', 'Cybersecurity', 'Disaster Management', 'Fintech', 'Heritage & Culture'];
  const commonSkills = ['All Skills', 'Frontend', 'Backend', 'AI/ML', 'IoT', 'UI/UX', 'PPT Making', 'Python', 'React', 'Node.js'];

  const fetchTeams = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: search.trim(),
        psCode: psCodeFilter === 'All PS Codes' ? '' : psCodeFilter.trim(),
        theme: selectedTheme,
        role: selectedRole,
        skills: selectedSkill === 'All Skills' ? '' : selectedSkill
      });

      const res = await axios.get(`${API_BASE}/api/teams?${queryParams.toString()}`);
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [search, psCodeFilter, selectedTheme, selectedRole, selectedSkill]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeamForRequest) return;

    try {
      await axios.post(`${API_BASE}/api/teams/${selectedTeamForRequest._id}/request`, {
        userId: user._id || 'user_sih_2026',
        userName: user.name || 'Applicant',
        email: user.email || '',
        role: selectedTeamForRequest.vacancies?.[0]?.roleName || 'Contributor',
        pitchNote,
        proofOfWork: user.github || user.portfolio || ''
      });

      toast.success(`Request sent to ${selectedTeamForRequest.name}!`);
      setSelectedTeamForRequest(null);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#F8FAFC] select-none">
      {/* Header Banner */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
          SIH 2026 DIRECTORY • {teams.length} SQUADS AVAILABLE
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight">Explore SIH Teams</h1>
        <p className="text-xs text-[#CBD5E1]">Find squads actively recruiting student innovators across Smart India Hackathon problem statements.</p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0B132B] border border-[#1E293B] p-5 rounded-2xl space-y-3 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <input
            type="text"
            placeholder="🔍 Search PS Code, title, squad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] placeholder-[#94A3B8]"
          />

          {/* PS Code Filter */}
          <input
            type="text"
            placeholder="🎯 PS Code (e.g. SIH1420)..."
            value={psCodeFilter}
            onChange={(e) => setPsCodeFilter(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] placeholder-[#94A3B8]"
          />

          {/* Theme Dropdown */}
          <select 
            value={selectedTheme} 
            onChange={(e) => setSelectedTheme(e.target.value)} 
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Themes">All SIH Themes</option>
            <option value="Agriculture & Rural Development">Agriculture & Rural Dev</option>
            <option value="Clean & Renewable Green Technology">Clean & Green Tech</option>
            <option value="Cybersecurity & Disaster Management">Cybersecurity</option>
            <option value="Smart Education & Learning">Smart Education</option>
            <option value="Healthcare & Biomedical Devices">Healthcare / MedTech</option>
            <option value="Fintech & Web3 Blockchain">Fintech & Web3</option>
          </select>

          {/* Vacancy Role Dropdown */}
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)} 
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Open Positions">All Open Positions</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="AI/ML Engineer">AI/ML Engineer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="PPT & Pitch Designer">PPT & Pitch Designer</option>
            <option value="IoT & Hardware Engineer">IoT & Hardware Engineer</option>
          </select>

          {/* Skills Filter Dropdown */}
          <select 
            value={selectedSkill} 
            onChange={(e) => setSelectedSkill(e.target.value)} 
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            {commonSkills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Quick Theme Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#1E293B]">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTheme(t === 'All Themes' ? 'All Themes' : t)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                (selectedTheme === t || (selectedTheme === 'All Themes' && t === 'All Themes'))
                  ? 'bg-[#261E0C] border border-[#F59E0B]/70 text-[#FBBF24]'
                  : 'bg-[#070D18] border border-[#334155] text-[#CBD5E1] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div key={t._id} className="bg-[#0B132B] border border-[#1E293B] hover:border-[#334155] rounded-2xl p-6 relative flex flex-col justify-between shadow-xl transition-all">
            <div className="space-y-3.5">
              <div className="flex justify-between items-start">
                <span className="bg-[#261E0C] text-[#FBBF24] border border-[#785412] text-[10px] font-mono px-2.5 py-0.5 rounded font-bold">
                  {t.sihTheme}
                </span>
                <span className="text-[10px] font-mono text-[#38BDF8] bg-[#0C2A4A] border border-[#0284C7]/50 px-2 py-0.5 rounded">
                  ● Active Squad
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{t.name}</h3>
                <p className="text-xs text-[#CBD5E1] mt-0.5 line-clamp-1">{t.tagline || t.description}</p>
              </div>

              <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold">PS: {t.psCode}</span>
                  <span className="text-[#94A3B8] uppercase">{t.categoryEdition || 'Software Edition'}</span>
                </div>
                <p className="text-xs text-white font-bold line-clamp-1">{t.problemStatementTitle}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#94A3B8] block mb-1.5 uppercase font-bold">
                  OPEN VACANCIES ({t.vacancies?.length || 0} NEEDED)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.vacancies && t.vacancies.length > 0 ? (
                    t.vacancies.map((v, idx) => (
                      <span key={idx} className="bg-[#17130A] border border-[#F59E0B]/50 text-[#FBBF24] text-[10px] font-mono px-2.5 py-1 rounded-lg">
                        ⚠️ {v.roleName}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono text-[#34D399]">Squad full (6/6)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E293B] mt-4 flex items-center justify-between">
              <span className="text-xs text-[#CBD5E1] font-mono font-bold">{t.members?.length || 1}/6 Members</span>
              <button 
                onClick={() => setSelectedTeamForRequest(t)} 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#000000] font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Request to Join ›
              </button>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl p-12 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-white">No squads matched your filter criteria</h3>
          <p className="text-xs text-[#CBD5E1]">Try resetting your PS Code, theme, or open position filters.</p>
        </div>
      )}

      {/* Join Modal */}
      {selectedTeamForRequest && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B132B] border border-amber-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Apply to {selectedTeamForRequest.name}</h3>
            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
              <textarea
                rows="3"
                required
                placeholder="Pitch note: Explain your technical skills, PPT strengths, and why you're a great fit for this SIH problem statement..."
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
                className="w-full bg-[#070D18] border border-[#334155] rounded-xl p-3 text-white focus:outline-none focus:border-[#F59E0B]"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedTeamForRequest(null)} className="w-1/2 bg-[#0F172A] border border-[#334155] text-[#CBD5E1] font-bold py-2.5 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black py-2.5 rounded-xl cursor-pointer shadow-md">
                  Send Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTeams;