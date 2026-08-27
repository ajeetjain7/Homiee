import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');

  // Popup Join Request Modal State
  const [selectedTeamForRequest, setSelectedTeamForRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    role: '',
    proofOfWork: ''
  });

  // 1. User State Initialization from localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {
        _id: 'temp_user_id',
        name: 'Aarav Shah',
        email: 'aarav@example.com',
        college: 'IET DAVV',
        role: 'Backend Developer',
        location: 'Indore, MP',
        about: 'Passionate full-stack developer and competitive programmer.',
        skills: ['Node.js', 'MongoDB', 'Express', 'Machine Learning', 'Python'],
        cfRating: '1389',
        codechefRating: '1570',
        leetcodeRating: '1650',
        dsaSolved: '1000+',
        github: 'https://github.com/aaravshah',
        portfolio: 'https://aarav.dev',
        resumeName: ''
      };
    } catch {
      return { _id: 'temp_user_id', name: 'Aarav Shah', email: 'aarav@example.com' };
    }
  });

  const [editForm, setEditForm] = useState(user);
  const [teams, setTeams] = useState([]);

  // Create Team Form State
  const [newTeam, setNewTeam] = useState({
    name: 'Kernel Panic',
    hackathon: 'Smart India Hackathon — Indore Regionals',
    description: 'What are you building, and for which track?',
    selectedRoles: ['Backend Developer']
  });

  const availableRoles = [
    'Backend Developer',
    'Frontend Developer',
    'UI Designer',
    'ML Engineer',
    'PM / Pitch'
  ];

  // Fetch Teams Live from Express/MongoDB Backend
  const fetchTeams = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teams?search=${encodeURIComponent(searchQuery)}`);
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // FIX 1: Filter teams where user is EITHER the team leader OR an accepted member
  const myCreatedTeams = teams.filter(t => {
    const isLeader = (t.leader?._id || t.leader) === user._id;
    const isMember = Array.isArray(t.members) && t.members.some(m => (m?._id || m) === user._id);
    return isLeader || isMember;
  });

  const myTeamsCount = teams.filter(t => (t.leader?._id || t.leader) === user._id).length;

  const handleOpenRequestModal = (team) => {
    const defaultRole = team.rolesNeeded && team.rolesNeeded.length > 0 
      ? team.rolesNeeded[0].replace('NEEDS: ', '') 
      : 'Backend Developer';

    setRequestForm({
      role: defaultRole,
      proofOfWork: user.github || user.portfolio || ''
    });
    setSelectedTeamForRequest(team);
  };

  const handleSubmitJoinRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeamForRequest) return;

    try {
      await axios.post(`http://localhost:5000/api/teams/${selectedTeamForRequest._id || selectedTeamForRequest.id}/request`, {
        userId: user._id,
        userName: user.name,
        role: requestForm.role,
        proofOfWork: requestForm.proofOfWork
      });

      toast.success(`Application sent to ${selectedTeamForRequest.name}!`);
      setSelectedTeamForRequest(null);
      fetchTeams();
    } catch (err) {
      console.error('Request error:', err);
      toast.error(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', {
        userId: user._id,
        name: editForm.name,
        college: editForm.college,
        role: editForm.role,
        location: editForm.location,
        about: editForm.about,
        skills: Array.isArray(editForm.skills) 
          ? editForm.skills 
          : String(editForm.skills).split(',').map(s => s.trim()),
        cfRating: editForm.cfRating,
        codechefRating: editForm.codechefRating,
        leetcodeRating: editForm.leetcodeRating,
        dsaSolved: editForm.dsaSolved,
        github: editForm.github,
        portfolio: editForm.portfolio,
        resumeName: editForm.resumeName
      });

      setUser(response.data);
      setEditForm(response.data);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setIsEditing(false);
      toast.success('Profile saved to MongoDB successfully!');
    } catch (error) {
      console.error('Save profile error:', error);
      setUser(editForm);
      localStorage.setItem('userInfo', JSON.stringify(editForm));
      setIsEditing(false);
      toast.error('Profile updated locally.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, resumeName: file.name });
    }
  };

  const handleRoleToggle = (role) => {
    if (newTeam.selectedRoles.includes(role)) {
      if (newTeam.selectedRoles.length === 1) return;
      setNewTeam({
        ...newTeam,
        selectedRoles: newTeam.selectedRoles.filter(r => r !== role)
      });
    } else {
      setNewTeam({
        ...newTeam,
        selectedRoles: [...newTeam.selectedRoles, role]
      });
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (myTeamsCount >= 3) {
      toast.error('Limit reached! Maximum 3 teams allowed per account.');
      return;
    }

    if (!newTeam.name || !newTeam.hackathon) {
      toast.error('Please fill in team name and hackathon.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/teams/create', {
        name: newTeam.name,
        hackathon: newTeam.hackathon,
        description: newTeam.description,
        rolesNeeded: newTeam.selectedRoles.map(r => `NEEDS: ${r}`),
        userId: user._id,
        userName: user.name
      });

      setTeams(prevTeams => [res.data, ...prevTeams]);
      toast.success('Team published successfully!');
      setActiveTab('myteams');
    } catch (err) {
      console.error('Error creating team:', err);
      toast.error(err.response?.data?.message || 'Failed to create team.');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/teams/${teamId}`, {
        data: { userId: user._id }
      });
      toast.success('Team deleted.');
      fetchTeams();
    } catch (err) {
      toast.error('Failed to delete team.');
    }
  };

  const handleKickMember = async (teamId, targetMemberId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await axios.post(`http://localhost:5000/api/teams/${teamId}/kick`, {
        userId: user._id,
        targetMemberId
      });
      toast.success('Member removed from team.');
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to kick member.');
    }
  };

  const handleMakeCoLeader = async (teamId, targetMemberId) => {
    try {
      await axios.post(`http://localhost:5000/api/teams/${teamId}/co-leader`, {
        userId: user._id,
        targetMemberId
      });
      toast.success('Member promoted to Co-Leader!');
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to promote member.');
    }
  };

  const handleRequestAction = async (teamId, requestId, action) => {
    try {
      await axios.post(`http://localhost:5000/api/teams/${teamId}/request/${requestId}/action`, { action });
      toast.success(`Request ${action}ed!`);
      fetchTeams();
    } catch (err) {
      toast.error('Failed to process request action.');
    }
  };

  // Reusable Exact Team Card Component
  const renderTeamCard = (team, isPreview = false) => {
    const isOwner = (team.leader?._id || team.leader) === user._id;
    const maxMembers = team.maxMembers || 5;
    const memberList = team.members || [];
    const filledCount = memberList.length || 1;
    const emptySlots = Math.max(0, maxMembers - filledCount);
    const pendingRequests = team.requests ? team.requests.filter(r => r.status === 'pending') : [];

    return (
      <div key={team._id || team.id} className="bg-[#11162B] border border-gray-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 flex items-start gap-1.5 pointer-events-none">
          <div className="bg-[#F59E0B] text-black font-extrabold text-xs px-2.5 py-1 rounded-bl-xl shadow-md z-10">
            {team.rank || `#${teams.indexOf(team) + 1 || 1}`}
          </div>
          <div className="bg-[#34D399] text-black font-black text-[10px] tracking-wider px-6 py-1 transform rotate-45 translate-x-4 translate-y-2 shadow-lg uppercase">
            {team.isOpen ? 'OPEN' : 'FULL'}
          </div>
        </div>

        <div>
          <div className="pr-20 mb-1">
            <h3 className="text-xl font-bold text-white tracking-tight">{team.name}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
              <span>🏆</span> {team.hackathon}
            </p>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed my-4">
            {team.description || 'This is how your team will appear to people browsing for a squad.'}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {team.skills && team.skills.map((s, idx) => (
              <span key={idx} className="bg-[#1A2035] text-gray-300 border border-gray-700/50 text-[11px] px-2.5 py-1 rounded-md font-mono">
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 py-3 border-t border-gray-800/60 mb-4">
            <div className="flex items-center gap-1.5">
              {memberList.map((m, idx) => {
                const initial = typeof m === 'object' && m?.name 
                  ? m.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : String(m).slice(0, 2).toUpperCase();

                const colors = ['bg-[#F59E0B]', 'bg-[#2DD4BF]', 'bg-[#60A5FA]', 'bg-[#F87171]'];
                const bgColor = colors[idx % colors.length];

                return (
                  <div key={idx} className={`w-7 h-7 rounded-md ${bgColor} text-black font-extrabold text-[11px] flex items-center justify-center shadow-sm`}>
                    {initial || 'Y'}
                  </div>
                );
              })}

              {Array.from({ length: emptySlots }).map((_, idx) => (
                <div key={idx} className="w-7 h-7 rounded-md border border-dashed border-gray-600/80 bg-transparent" />
              ))}
            </div>

            <span className="text-xs text-gray-400 font-mono">
              {filledCount}/{maxMembers} filled
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {team.rolesNeeded && team.rolesNeeded.map((role, idx) => (
              <span key={idx} className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-[11px] px-3 py-1.5 rounded-lg font-mono font-semibold">
                {role.startsWith('NEEDS:') ? role : `NEEDS: ${role}`}
              </span>
            ))}
          </div>

          {!isPreview && isOwner && pendingRequests.length > 0 && (
            <div className="mb-4 pt-3 border-t border-gray-800/80 space-y-2">
              <span className="text-xs font-bold text-gray-300 block">
                Pending Requests ({pendingRequests.length})
              </span>
              {pendingRequests.map((req) => (
                <div key={req._id} className="bg-[#0A0D14] border border-gray-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{req.userName}</span>
                    <p className="text-[10px] text-amber-400">{req.role}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleRequestAction(team._id, req._id, 'accept')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] cursor-pointer">✓</button>
                    <button onClick={() => handleRequestAction(team._id, req._id, 'reject')} className="bg-rose-950 text-rose-400 hover:bg-rose-900 px-2.5 py-1 rounded-lg text-[11px] cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isPreview && isOwner ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#261E0C] border border-[#785412] text-[#FBBF24] font-bold text-xs py-3 rounded-xl text-center">
              👑 Team Owner
            </div>
            <button onClick={() => handleDeleteTeam(team._id || team.id)} className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 p-3 rounded-xl cursor-pointer" title="Delete Team">
              🗑️
            </button>
          </div>
        ) : (
          <button 
            onClick={() => !isPreview && handleOpenRequestModal(team)} 
            disabled={!team.isOpen}
            className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              team.isOpen ? 'bg-[#F59E0B] hover:bg-[#D97706] text-black' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>{team.isOpen ? 'View & Request to Join ›' : 'Team Roster Full'}</span>
          </button>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-mono">WELCOME BACK</span>
              <h1 className="text-3xl font-bold text-white mt-1">Ready to build your next squad, {user?.name ? user.name.split(' ')[0] : 'Dev'}?</h1>
              <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                Create a team and post open roles, or browse existing teams and request to join with your proof of work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => setActiveTab('create')} className="bg-[#11162B] border border-gray-800 hover:border-amber-500/50 p-6 rounded-2xl cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl mb-4">+</div>
                <h3 className="font-bold text-lg text-white mb-1">Create a team</h3>
                <p className="text-xs text-gray-400">Register your team, name the hackathon, and list open roles ({myTeamsCount}/3 created).</p>
              </div>

              <div onClick={() => setActiveTab('browse')} className="bg-[#11162B] border border-gray-800 hover:border-cyan-500/50 p-6 rounded-2xl cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl mb-4">🔍</div>
                <h3 className="font-bold text-lg text-white mb-1">Join a team</h3>
                <p className="text-xs text-gray-400">Browse open rosters, and send a request with your achievements and proof of work.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-[#11162B] border border-gray-800/80 p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">{teams.length}</div>
                <div className="text-xs text-gray-400">Open teams</div>
              </div>
              <div className="bg-[#11162B] border border-gray-800/80 p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">112</div>
                <div className="text-xs text-gray-400">Members looking</div>
              </div>
              <div className="bg-[#11162B] border border-gray-800/80 p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">4</div>
                <div className="text-xs text-gray-400">Live hackathons</div>
              </div>
            </div>
          </div>
        );

      /* EXACT MY TEAM PAGE WITH REAL POPULATED MEMBER NAMES */
      case 'myteams':
        return (
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500">MY TEAM</span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">
                  {myCreatedTeams[0]?.name || 'Null Pointers'}
                </h1>
              </div>
              
              {myCreatedTeams.length > 0 && (
                <button className="bg-[#181F38] hover:bg-[#20294A] border border-gray-700/80 text-gray-200 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                  ⚙️ Edit team
                </button>
              )}
            </div>

            {myCreatedTeams.length > 0 ? (
              myCreatedTeams.map((team) => {
                const isLeader = (team.leader?._id || team.leader) === user._id;
                const filledMembers = team.members || [];
                const rolesNeeded = team.rolesNeeded || [];

                return (
                  <div key={team._id} className="bg-[#11162B] border border-gray-800/80 rounded-2xl p-8 relative space-y-8 shadow-2xl">
                    
                    {/* Top Banner Stats */}
                    <div className="flex justify-between items-start pb-6 border-b border-gray-800/80">
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <span>🏆</span> {team.hackathon}
                        </p>
                        <p className="text-xs font-mono text-amber-400">
                          ⭐ 940 pts &nbsp;•&nbsp; {filledMembers.length}/{team.maxMembers || 5} roster filled
                        </p>
                      </div>
                      
                      <div className="bg-[#F59E0B] text-black font-extrabold text-sm px-3 py-1.5 rounded-xl shadow-md">
                        #1
                      </div>
                    </div>

                    {/* Roster & Roles List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white tracking-wide">Roster & roles</h3>

                      {/* Active Members Rows */}
                      {filledMembers.map((m, idx) => {
                        // FIX 2: Safely parse populated object fields from MongoDB backend
                        const memberId = typeof m === 'object' ? m._id : m;
                        const memberName = typeof m === 'object' && m.name ? m.name : (idx === 0 ? user.name : `Member ${idx + 1}`);
                        const memberRole = typeof m === 'object' && m.role ? m.role : (idx === 0 ? 'Team Lead' : 'Contributor');
                        
                        const isMainLeader = (team.leader?._id || team.leader) === memberId;
                        const isCoLeader = team.coLeaders?.includes(memberId);

                        const initials = memberName.split(' ').map(n => n[0]).join('').toUpperCase();
                        const avatarColors = ['bg-[#F59E0B]', 'bg-[#2DD4BF]', 'bg-[#60A5FA]'];

                        return (
                          <div key={idx} className="bg-[#161C30] border border-gray-800/80 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl ${avatarColors[idx % 3]} text-black font-extrabold text-sm flex items-center justify-center shadow-md`}>
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">{memberName}</span>
                                  {isMainLeader && <span className="text-xs text-gray-400 font-normal">(Leader) 👑</span>}
                                  {isCoLeader && <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">Co-Leader</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{memberRole}</p>
                              </div>
                            </div>

                            {/* Leader Controls */}
                            <div className="flex items-center gap-2">
                              {isLeader && !isMainLeader && (
                                <>
                                  {!isCoLeader && (
                                    <button 
                                      onClick={() => handleMakeCoLeader(team._id, memberId)}
                                      className="bg-[#1E2745] hover:bg-[#28345C] text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                                    >
                                      Make Co-Leader
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleKickMember(team._id, memberId)}
                                    className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                                  >
                                    Kick
                                  </button>
                                </>
                              )}
                              <button className="bg-[#0E3A2F] hover:bg-[#134E3F] text-[#34D399] font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                                ✉ Contact
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Open Slot Rows with Review Requests Action */}
                      {rolesNeeded.map((role, idx) => (
                        <div key={idx} className="bg-[#13182B] border border-dashed border-gray-800 p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl border border-dashed border-gray-700 bg-transparent flex items-center justify-center text-gray-600" />
                            <div>
                              <span className="text-xs font-medium text-gray-400 block">Open slot</span>
                              <span className="text-xs font-mono font-bold text-[#FBBF24] mt-0.5 block">
                                {role.startsWith('NEEDS:') ? role : `NEEDS: ${role}`}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setActiveTab('requests')}
                            className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Review requests
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#11162B] border border-gray-800/80 rounded-2xl p-12 text-center space-y-3">
                <p className="text-xs text-gray-400">You haven't created or joined any teams yet.</p>
                <button onClick={() => setActiveTab('create')} className="bg-[#F59E0B] text-black font-bold text-xs px-5 py-2.5 rounded-xl">
                  + Create Team
                </button>
              </div>
            )}
          </div>
        );

      case 'browse':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl font-bold text-white tracking-tight">Browse teams</h1>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="🔍 Search team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#11162B] border border-gray-800 text-xs px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#11162B] border border-gray-800 text-xs px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All roles">All roles</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="UI Designer">UI Designer</option>
                  <option value="ML Engineer">ML Engineer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.length > 0 ? (
                teams.map((team) => renderTeamCard(team))
              ) : (
                <div className="col-span-2 text-center py-16 text-gray-500 text-xs">
                  No teams found.
                </div>
              )}
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-8 max-w-3xl">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create a team</h1>

            <form onSubmit={handleCreateTeam} className="space-y-6 text-xs">
              <div>
                <label className="block text-gray-400 mb-2 font-medium">Team name</label>
                <input 
                  type="text" 
                  required
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g. Kernel Panic" 
                  className="w-full bg-[#11162B] border border-gray-800/80 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 font-medium">Hackathon</label>
                <input 
                  type="text" 
                  required
                  value={newTeam.hackathon}
                  onChange={(e) => setNewTeam({ ...newTeam, hackathon: e.target.value })}
                  placeholder="Smart India Hackathon — Indore Regionals" 
                  className="w-full bg-[#11162B] border border-gray-800/80 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 font-medium">Description</label>
                <textarea 
                  rows="3" 
                  required
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="What are you building, and for which track?" 
                  className="w-full bg-[#11162B] border border-gray-800/80 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-3 font-medium">Roles you still need</label>
                <div className="flex flex-wrap gap-2.5">
                  {availableRoles.map((role) => {
                    const isSelected = newTeam.selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#261E0C] border border-[#785412] text-[#FBBF24]' 
                            : 'bg-[#161C2E] border border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs py-4 rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Publish team
              </button>
            </form>

            <div className="pt-6 border-t border-gray-800/60 space-y-4">
              <span className="text-xs text-gray-400 font-mono uppercase tracking-wider block">Live preview</span>
              
              {renderTeamCard({
                id: 'preview',
                name: newTeam.name || 'Kernel Panic',
                hackathon: newTeam.hackathon || 'Smart India Hackathon — Indore Regionals',
                description: newTeam.description || 'This is how your team will appear to people browsing for a squad.',
                skills: ['New team'],
                members: [user.name ? user.name.slice(0, 1).toUpperCase() : 'Y'],
                maxMembers: 5,
                rolesNeeded: newTeam.selectedRoles.map(r => `NEEDS: ${r}`),
                isOpen: true,
                rank: '#6'
              }, true)}
            </div>
          </div>
        );

      case 'requests':
        return (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Requests</h1>
            <div className="flex gap-2 mb-4">
              <button className="bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">Received</button>
              <button className="bg-[#11162B] text-gray-400 hover:text-white border border-gray-800 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">Sent By Me</button>
            </div>
            
            {myCreatedTeams.some(t => t.requests && t.requests.some(r => r.status === 'pending')) ? (
              myCreatedTeams.flatMap(t => (t.requests || []).filter(r => r.status === 'pending').map(r => ({ ...r, teamId: t._id, teamName: t.name }))).map((req) => (
                <div key={req._id} className="bg-[#11162B] border border-gray-800 p-4 rounded-xl flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="font-bold text-white text-sm">{req.userName}</span>
                    <p className="text-gray-400 mt-0.5">Applying for <span className="text-amber-400">{req.role}</span> in <span className="text-white font-bold">{req.teamName}</span></p>
                    {req.proofOfWork && <a href={req.proofOfWork} target="_blank" rel="noreferrer" className="text-cyan-400 text-[10px] hover:underline block mt-1">🔗 Proof of Work: {req.proofOfWork}</a>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRequestAction(req.teamId, req._id, 'accept')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer">✓ Accept</button>
                    <button onClick={() => handleRequestAction(req.teamId, req._id, 'reject')} className="bg-rose-950 text-rose-400 hover:bg-rose-900 px-3 py-1.5 rounded-lg cursor-pointer">✕ Reject</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No pending requests received.</p>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Your profile</h1>
              <button
                onClick={() => {
                  if (isEditing) handleSaveProfile();
                  else {
                    setEditForm(user);
                    setIsEditing(true);
                  }
                }}
                className={`${
                  isEditing ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-amber-500 hover:bg-amber-400 text-black'
                } font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer`}
              >
                {isEditing ? '💾 Save Changes' : '✏️ Edit Profile'}
              </button>
            </div>

            <div className="bg-[#11162B] border border-gray-800/80 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500 text-black font-extrabold text-xl flex items-center justify-center">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AS'}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                      placeholder="Full Name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.college || ''}
                        onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                        className="w-1/2 bg-[#0A0D14] border border-gray-700 rounded px-3 py-1 text-xs text-white"
                        placeholder="College"
                      />
                      <input
                        type="text"
                        value={editForm.role || ''}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-1/2 bg-[#0A0D14] border border-gray-700 rounded px-3 py-1 text-xs text-white"
                        placeholder="Role (e.g. Backend Developer)"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                    <p className="text-xs text-gray-400">{user.college} · {user.role}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {user.location}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#11162B] border border-gray-800/80 p-6 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-gray-300">About Me</h3>
              {isEditing ? (
                <textarea
                  rows="3"
                  value={editForm.about || ''}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Write a short summary about your background..."
                />
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {user.about || 'No about info provided yet.'}
                </p>
              )}
            </div>

            <div className="bg-[#11162B] border border-gray-800/80 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-gray-300">Links & Portfolios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">GitHub Profile</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.github || ''}
                      onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-2 text-white"
                    />
                  ) : (
                    <a href={user.github} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      {user.github || 'Not provided'}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Portfolio / Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.portfolio || ''}
                      onChange={(e) => setEditForm({ ...editForm, portfolio: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-2 text-white"
                    />
                  ) : (
                    <a href={user.portfolio} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      {user.portfolio || 'Not provided'}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#11162B] border border-gray-800/80 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Skills</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={Array.isArray(editForm.skills) ? editForm.skills.join(', ') : editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-2 text-xs text-white"
                  placeholder="Comma separated: Node.js, React, Python"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.skills && user.skills.map((skill) => (
                    <span key={skill} className="bg-[#1A2035] text-gray-300 border border-gray-700/50 text-xs px-3 py-1 rounded-md font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#11162B] border border-gray-800/80 p-6 rounded-2xl space-y-2 text-xs">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Achievements</h3>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">LeetCode Rating</label>
                    <input
                      type="text"
                      value={editForm.leetcodeRating || ''}
                      onChange={(e) => setEditForm({ ...editForm, leetcodeRating: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Codeforces Rating</label>
                    <input
                      type="text"
                      value={editForm.cfRating || ''}
                      onChange={(e) => setEditForm({ ...editForm, cfRating: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">CodeChef Rating</label>
                    <input
                      type="text"
                      value={editForm.codechefRating || ''}
                      onChange={(e) => setEditForm({ ...editForm, codechefRating: e.target.value })}
                      className="w-full bg-[#0A0D14] border border-gray-700 rounded px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-400">LeetCode rating: <span className="text-amber-400 font-bold">{user.leetcodeRating || 'N/A'}</span></p>
                  <p className="text-gray-400">Codeforces rating: <span className="text-amber-400 font-bold">{user.cfRating || 'N/A'}</span></p>
                  <p className="text-gray-400">CodeChef rating: <span className="text-amber-400 font-bold">{user.codechefRating || 'N/A'}</span></p>
                  <p className="text-gray-400">{user.dsaSolved || '1000+'} DSA problems solved</p>
                </>
              )}
            </div>

            <div>
              <label className="bg-[#11162B] border border-gray-800 hover:border-amber-500/50 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2">
                📎 {user.resumeName ? `Uploaded: ${user.resumeName}` : 'Upload Resume (PDF)'}
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D18] text-white flex flex-col font-sans relative">
      <div className="bg-amber-500 text-black font-mono font-bold text-[11px] py-1.5 px-4 overflow-hidden whitespace-nowrap flex items-center gap-4">
        <span>⚡ SMART INDIA HACKATHON — INDORE REGIONALS IN 12 DAYS</span>
        <span>•</span>
        <span>HACKINDORE 5.0 REGISTRATIONS OPEN</span>
      </div>

      <div className="flex flex-1">
        <aside className="w-20 lg:w-48 bg-[#0D1021] border-r border-gray-800/80 p-4 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-extrabold flex items-center justify-center text-lg">⚡</div>
              <span className="font-bold text-lg hidden lg:inline">Homiee</span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'home', label: 'Home', icon: '🏠' },
                { id: 'myteams', label: 'My Team', icon: '👥' },
                { id: 'browse', label: 'Browse', icon: '🔍' },
                { id: 'create', label: 'Create', icon: '➕' },
                { id: 'requests', label: 'Requests', icon: '🔔' },
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                      : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* POPUP JOIN REQUEST MODAL */}
      {selectedTeamForRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#11162B] border border-gray-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Join {selectedTeamForRequest.name}</h3>
              <button 
                onClick={() => setSelectedTeamForRequest(null)} 
                className="text-gray-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitJoinRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Target Role</label>
                <select
                  value={requestForm.role}
                  onChange={(e) => setRequestForm({ ...requestForm, role: e.target.value })}
                  className="w-full bg-[#0A0D14] border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {selectedTeamForRequest.rolesNeeded && selectedTeamForRequest.rolesNeeded.length > 0 ? (
                    selectedTeamForRequest.rolesNeeded.map((r, idx) => (
                      <option key={idx} value={r.replace('NEEDS: ', '')}>
                        {r.replace('NEEDS: ', '')}
                      </option>
                    ))
                  ) : (
                    <option value="Contributor">Contributor</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Proof of Work (GitHub / Portfolio URL)</label>
                <input
                  type="url"
                  value={requestForm.proofOfWork}
                  onChange={(e) => setRequestForm({ ...requestForm, proofOfWork: e.target.value })}
                  placeholder="https://github.com/yourusername/project"
                  className="w-full bg-[#0A0D14] border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedTeamForRequest(null)} 
                  className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;