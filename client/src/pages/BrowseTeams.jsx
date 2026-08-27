import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BrowseTeams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All Themes');
  const [selectedRole, setSelectedRole] = useState('All Open Positions');
  
  const [selectedTeamForRequest, setSelectedTeamForRequest] = useState(null);
  const [pitchNote, setPitchNote] = useState('');

  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const themes = ['All Themes', 'Agriculture & Rural Dev', 'Clean & Green Tech', 'Cybersecurity', 'Disaster Management', 'Fintech', 'Heritage & Culture'];

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teams?search=${encodeURIComponent(search)}&theme=${selectedTheme}&role=${selectedRole}`);
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [search, selectedTheme, selectedRole]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeamForRequest) return;

    try {
      await axios.post(`http://localhost:5000/api/teams/${selectedTeamForRequest._id}/request`, {
        userId: user._id || 'user_sih_2026',
        userName: user.name || 'Applicant',
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">SIH 2026 DIRECTORY • {teams.length} SQUADS AVAILABLE</span>
        <h1 className="text-3xl font-black text-white tracking-tight">Explore SIH Teams</h1>
        <p className="text-xs text-gray-400">Find teams actively recruiting student innovators across Smart India Hackathon problem statements.</p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0B132B] border border-gray-800 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="🔍 Search PS Code, theme, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-amber-500"
          />

          <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white">
            <option value="All Themes">All SIH Themes</option>
            <option value="Agriculture & Rural Development">Agriculture & Rural Dev</option>
            <option value="Clean & Renewable Green Technology">Clean & Green Tech</option>
            <option value="Cybersecurity & Disaster Management">Cybersecurity</option>
          </select>

          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white">
            <option value="All Open Positions">All Open Positions</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="AI/ML Engineer">AI/ML Engineer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="IoT & Hardware Engineer">IoT & Hardware Engineer</option>
          </select>

          <div className="bg-[#0E3A2F] border border-[#059669]/40 text-[#34D399] font-mono text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            ✓ SORTED BY COMPATIBILITY
          </div>
        </div>

        {/* Quick Theme Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTheme(t === 'All Themes' ? 'All Themes' : t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                (selectedTheme === t || (selectedTheme === 'All Themes' && t === 'All Themes'))
                  ? 'bg-[#261E0C] border border-[#785412] text-[#FBBF24]'
                  : 'bg-[#070D18] border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div key={t._id} className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 relative flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="bg-[#261E0C] text-[#FBBF24] border border-[#785412] text-[10px] font-mono px-2.5 py-0.5 rounded font-bold">{t.sihTheme}</span>
                <span className="text-[10px] font-mono text-cyan-400">● 48% Match</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.tagline || t.description}</p>
              </div>

              <div className="bg-[#070D18] border border-gray-800 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold">PS: {t.psCode}</span>
                  <span className="text-gray-500 uppercase">{t.categoryEdition}</span>
                </div>
                <p className="text-xs text-gray-200 font-bold line-clamp-1">{t.problemStatementTitle}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-500 block mb-1.5 uppercase">OPEN VACANCIES ({t.vacancies?.length || 0} NEEDED)</span>
                <div className="flex flex-wrap gap-1.5">
                  {t.vacancies?.map((v, idx) => (
                    <span key={idx} className="bg-[#17130A] border border-[#785412] text-[#FBBF24] text-[10px] font-mono px-2.5 py-1 rounded-md">
                      ⚠️ {v.roleName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">{t.members?.length || 1}/6 Members</span>
              <button onClick={() => setSelectedTeamForRequest(t)} className="bg-[#FF7A00] hover:bg-[#E06D00] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer">
                Request to Join ›
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Join Modal */}
      {selectedTeamForRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B132B] border border-gray-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Apply to {selectedTeamForRequest.name}</h3>
            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
              <textarea
                rows="3"
                required
                placeholder="Pitch note: Explain your skills and why you're a great fit for this SIH problem statement..."
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
                className="w-full bg-[#070D18] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedTeamForRequest(null)} className="w-1/2 bg-gray-800 text-gray-300 font-bold py-2.5 rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 bg-[#FF7A00] text-black font-bold py-2.5 rounded-xl">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTeams;