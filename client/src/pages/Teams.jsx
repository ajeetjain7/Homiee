import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TeamCard from '../components/TeamCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/teams`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setTeams(res.data);
        }
      })
      .catch(err => console.error('Error fetching teams:', err));
  }, []);

  const filteredTeams = teams.filter(t => 
    (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.teamName && t.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.criticalSkills && t.criticalSkills.some(s => (s.skillName || s).toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (t.skills && t.skills.some(s => (s.skillName || s).toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleRequestJoin = (team) => {
    alert(`Request sent to join ${team.name || team.teamName}!`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-6 md:p-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Browse Teams</h1>
          <p className="text-gray-400 text-sm mt-1">Find open roles or create your team for upcoming hackathons.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20">
          + Create Team
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search teams by name or skills (e.g. React, Python)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#161B26] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-gray-500"
        />
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <TeamCard key={team.id} team={team} onRequestJoin={handleRequestJoin} />
        ))}
      </div>
    </div>
  );
};

export default Teams;