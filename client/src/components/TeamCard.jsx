import React from 'react';

const TeamCard = ({ team, onRequestJoin }) => {
  if (!team) return null;

  const skills = Array.isArray(team.skills) ? team.skills : [];
  const rolesNeeded = Array.isArray(team.rolesNeeded) ? team.rolesNeeded : [];
  const isOpen = team.status === 'open' || team.isOpen;

  return (
    <div className="bg-[#161B26] border border-gray-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-white">{team.teamName || team.name}</h3>
            <p className="text-xs text-amber-400 font-medium mt-0.5">🏆 {team.hackathonName || team.hackathon}</p>
          </div>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
            isOpen 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {isOpen ? 'open' : 'full'}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
          {team.description}
        </p>

        {/* Tech Stack / Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map((skill, index) => (
            <span key={index} className="bg-[#0B0F17] text-gray-300 border border-gray-800 text-[11px] px-2.5 py-1 rounded-md font-mono">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        {/* Roles Needed */}
        <div className="bg-[#0B0F17] border border-gray-800/80 rounded-xl p-3 mb-4 flex justify-between items-center text-xs">
          <span className="text-gray-400">Roles Needed:</span>
          <span className="text-indigo-400 font-semibold">
            {rolesNeeded.length > 0 ? rolesNeeded.join(', ') : 'None'}
          </span>
        </div>

        {/* Footer & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
          <span className="text-xs text-gray-500 font-mono">
            {team.membersCount || (team.members ? team.members.length : 1)}/{team.maxMembers || 5} members
          </span>
          <button 
            onClick={() => onRequestJoin(team)}
            disabled={!isOpen}
            className={`font-semibold text-xs py-2 px-4 rounded-lg transition-all ${
              isOpen 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isOpen ? 'Request to Join' : 'Full'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;