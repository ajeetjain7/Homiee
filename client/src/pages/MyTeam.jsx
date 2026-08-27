import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import CreateTeamModal from '../components/CreateTeamModal';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};
const API_BASE = getApiBase();

const MyTeam = ({ currentUser }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const localUser = currentUser || (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const token = localStorage.getItem('token');

  // Fetch all squads where the logged-in user is leader or member
  const fetchMyTeams = async () => {
    setLoading(true);
    try {
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          userId: localUser?._id,
          email: localUser?.email,
          userName: localUser?.name
        }
      };

      let fetchedTeams = [];

      try {
        const res = await axios.get(`${API_BASE}/api/teams/team`, config);
        if (res.data?.teams && Array.isArray(res.data.teams) && res.data.teams.length > 0) {
          fetchedTeams = res.data.teams;
        } else if (res.data?.team) {
          fetchedTeams = [res.data.team];
        }
      } catch (err) {
        console.warn('API /team error, trying /my-team:', err);
        try {
          const res2 = await axios.get(`${API_BASE}/api/teams/my-team`, config);
          if (res2.data?.teams && Array.isArray(res2.data.teams)) {
            fetchedTeams = res2.data.teams;
          } else if (res2.data?.team) {
            fetchedTeams = [res2.data.team];
          }
        } catch {
          // fallback below
        }
      }

      // Fallback: Check all teams to ensure nothing is missed
      if (fetchedTeams.length === 0) {
        const allRes = await axios.get(`${API_BASE}/api/teams`);
        const userTeams = allRes.data.filter(t => {
          const isLeaderMatch = 
            (t.leader?._id && t.leader._id === localUser?._id) ||
            t.leader === localUser?._id ||
            (localUser?.email && t.leader?.email?.toLowerCase() === localUser.email.toLowerCase()) ||
            (localUser?.name && (t.leaderName?.toLowerCase() === localUser.name.toLowerCase() || t.leader?.name?.toLowerCase() === localUser.name.toLowerCase()));

          const isMemberMatch = Array.isArray(t.members) && t.members.some(m => 
            (m?._id && m._id === localUser?._id) ||
            m === localUser?._id ||
            (localUser?.email && m?.email?.toLowerCase() === localUser.email.toLowerCase()) ||
            (localUser?.name && m?.name?.toLowerCase() === localUser.name.toLowerCase())
          );

          return isLeaderMatch || isMemberMatch;
        });

        if (userTeams.length > 0) {
          fetchedTeams = userTeams;
        }
      }

      setTeams(fetchedTeams);
      if (fetchedTeams.length > 0) {
        setSelectedTeamId((prev) => {
          const exists = fetchedTeams.some(t => t._id === prev);
          return exists ? prev : fetchedTeams[0]._id;
        });
      } else {
        setSelectedTeamId(null);
      }
    } catch (err) {
      console.error('Error fetching squads:', err);
      setTeams([]);
      setSelectedTeamId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, [localUser?._id, localUser?.email, localUser?.name]);

  // Current active team
  const activeTeam = teams.find(t => t._id === selectedTeamId) || (teams.length > 0 ? teams[0] : null);

  // Load persistent message history via REST & Socket.io for active team
  useEffect(() => {
    if (!activeTeam?._id) return;

    // 1. Fetch persistent history from MongoDB via REST endpoint
    axios.get(`${API_BASE}/api/teams/${activeTeam._id}/messages`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMessages(res.data);
        }
      })
      .catch(err => console.warn('Could not preload messages:', err.message));

    // 2. Connect Socket.IO for cross-device real-time sync with robust reconnects
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_team', {
        teamId: activeTeam._id,
        user: localUser
      });
    });

    socket.on('initial_messages', (initMsgs) => {
      if (Array.isArray(initMsgs) && initMsgs.length > 0) {
        setMessages(initMsgs);
      }
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        // Prevent duplicate rendering of same message ID
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    // 3. Fallback background sync (2.5s) to guarantee zero missed messages on firewalled or unstable connections
    const syncInterval = setInterval(() => {
      if (activeTeam?._id) {
        axios.get(`${API_BASE}/api/teams/${activeTeam._id}/messages`)
          .then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
              setMessages(prev => {
                const map = new Map(prev.map(m => [m._id, m]));
                let changed = false;
                res.data.forEach(m => {
                  if (!map.has(m._id)) {
                    map.set(m._id, m);
                    changed = true;
                  }
                });
                return changed ? Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : prev;
              });
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      socket.disconnect();
      clearInterval(syncInterval);
    };
  }, [activeTeam?._id]);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Leader Management Controls
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    psCode: '',
    problemStatementTitle: '',
    description: '',
    sihTheme: '',
    organization: ''
  });

  const openEditModal = () => {
    if (!activeTeam) return;
    setEditTeamForm({
      name: activeTeam.name || '',
      psCode: activeTeam.psCode || '',
      problemStatementTitle: activeTeam.problemStatementTitle || '',
      description: activeTeam.description || '',
      sihTheme: activeTeam.sihTheme || '',
      organization: activeTeam.organization || ''
    });
    setIsEditingTeam(true);
  };

  const handleSaveTeamEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.put(`${API_BASE}/api/teams/${activeTeam._id}`, {
        userId: localUser?._id,
        ...editTeamForm
      }, config);
      toast.success('Squad details updated successfully!');
      setIsEditingTeam(false);
      fetchMyTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update squad.');
    }
  };

  const handleKickMember = async (targetMemberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this squad?`)) return;
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${API_BASE}/api/teams/${activeTeam._id}/kick`, {
        userId: localUser?._id,
        targetMemberId
      }, config);
      toast.success(`Removed ${memberName} from squad.`);
      fetchMyTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${activeTeam.name}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        data: { userId: localUser?._id }
      };
      await axios.delete(`${API_BASE}/api/teams/${activeTeam._id}`, config);
      toast.success('Squad deleted successfully.');
      fetchMyTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete squad.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeTeam?._id) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    const senderPayload = {
      _id: localUser?._id || 'user_anon',
      name: localUser?.name || 'Innovator',
      email: localUser?.email || '',
      avatar: localUser?.avatar || localUser?.photoUrl || '',
      role: localUser?.primaryRole || 'Squad Member'
    };

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('send_message', {
        teamId: activeTeam._id,
        message: messageText,
        user: senderPayload
      });
    } else {
      // Direct REST fallback with MongoDB persistence
      try {
        const res = await axios.post(`${API_BASE}/api/teams/${activeTeam._id}/messages`, {
          message: messageText,
          user: senderPayload
        });
        setMessages(prev => [...prev, res.data]);
      } catch (err) {
        console.error('REST Message dispatch error:', err);
        const fallbackMsg = {
          _id: `msg_${Date.now()}`,
          teamId: activeTeam._id,
          message: messageText,
          user: senderPayload,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    }
  };

  const copyEmailToClipboard = (email, name) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success(`Copied ${name}'s email (${email}) to clipboard!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#0B132B] border border-[#1E293B] p-8 rounded-2xl text-center space-y-3 max-w-sm w-full">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-black font-black text-xl flex items-center justify-center mx-auto animate-bounce">
            ⚡
          </div>
          <h3 className="text-base font-bold text-white">Loading Squads...</h3>
          <p className="text-xs text-[#CBD5E1] font-mono">Fetching verified roster credentials</p>
        </div>
      </div>
    );
  }

  // 1. EMPTY STATE: User has no squads
  if (!activeTeam || teams.length === 0) {
    return (
      <>
        <div className="max-w-4xl mx-auto space-y-6 font-sans text-[#F8FAFC] select-none">
          <div>
            <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
              SIH 2026 SQUAD MANAGEMENT
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">My Squads</h1>
            <p className="text-xs text-[#CBD5E1]">You are currently not part of an active Smart India Hackathon squad.</p>
          </div>

          <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-10 md:p-14 text-center space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#17130A] border border-[#F59E0B]/50 text-[#F59E0B] flex items-center justify-center text-3xl font-black mx-auto shadow-xl shadow-amber-500/10">
              ⚡
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-black text-white">No Squads Formed Yet</h2>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                You haven't formed or joined a team yet. Click <span className="text-amber-400 font-bold">"Create Team"</span> (top right) to start one, or explore open squads to request joining.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                + Create a Squad
              </button>
              <Link
                to="/teams"
                className="w-full sm:w-auto bg-[#070D18] hover:bg-[#0B132B] border border-[#334155] hover:border-[#64748B] text-[#F8FAFC] font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                🔍 Explore Open Squads
              </Link>
            </div>

            {/* Tips Box */}
            <div className="pt-6 border-t border-[#1E293B] max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="bg-[#070D18] border border-[#1E293B] p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-[#F59E0B] font-bold block">💡 CREATING A SQUAD</span>
                <p className="text-[11px] text-[#CBD5E1]">Click "Create Team" to define your problem statement and open role vacancies.</p>
              </div>
              <div className="bg-[#070D18] border border-[#1E293B] p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold block">🤝 JOINING A SQUAD</span>
                <p className="text-[11px] text-[#CBD5E1]">Browse squads in your preferred SIH theme and submit join requests with your pitch.</p>
              </div>
            </div>
          </div>
        </div>

        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchMyTeams()}
        />
      </>
    );
  }

  // 2. EXTRACT MEMBERS FOR THE ACTIVE SQUAD
  const leaderObj = typeof activeTeam.leader === 'object' ? activeTeam.leader : null;
  const memberList = Array.isArray(activeTeam.members) ? activeTeam.members : [];
  
  const uniqueMembers = [];
  const addedIds = new Set();

  // Add leader
  if (leaderObj && (leaderObj._id || leaderObj.name || leaderObj.email || activeTeam.leaderName)) {
    const isUserLeader = (localUser && (localUser._id === leaderObj._id || localUser.name === leaderObj.name || localUser.name === activeTeam.leaderName || localUser.email === leaderObj.email));
    const leaderEmail = leaderObj.email || (isUserLeader && localUser?.email ? localUser.email : 'leader@sih.edu');
    
    uniqueMembers.push({ 
      ...leaderObj, 
      name: leaderObj.name || activeTeam.leaderName || 'Squad Leader',
      email: leaderEmail,
      isLeader: true 
    });
    if (leaderObj._id) addedIds.add(leaderObj._id.toString());
  }

  // Add members
  memberList.forEach((m, idx) => {
    const mObj = typeof m === 'object' ? m : { _id: m, name: `Squad Member ${idx + 1}` };
    const mId = mObj._id ? mObj._id.toString() : String(m);
    
    if (!addedIds.has(mId)) {
      const isLeader = leaderObj ? (leaderObj._id?.toString() === mId || leaderObj.toString() === mId) : false;
      const isMe = localUser && (localUser._id === mId || localUser.name === mObj.name || (localUser.email && localUser.email === mObj.email));
      const memberEmail = mObj.email || (isMe && localUser?.email ? localUser.email : (isLeader ? leaderObj?.email : `member_${idx + 1}@sih.edu`));

      uniqueMembers.push({
        ...mObj,
        email: memberEmail,
        isLeader
      });
      if (mId) addedIds.add(mId);
    }
  });

  const memberCount = uniqueMembers.length;
  const maxMembers = activeTeam.maxMembers || 6;

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-[#F8FAFC] select-none pb-12">
      
      {/* Squads Switcher Bar if User Leads/Belongs to Multiple Teams */}
      {teams.length > 1 && (
        <div className="bg-[#0B132B] border border-[#1E293B] p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
              ⚡ YOUR ACTIVE SQUADS ({teams.length})
            </span>
            <span className="text-xs text-[#CBD5E1]">Select a squad to view its roster & chat:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((t) => {
              const isSelected = t._id === activeTeam._id;
              const isLeader = (t.leader?._id === localUser?._id || t.leader === localUser?._id || t.leaderName === localUser?.name || t.leader?.email === localUser?.email);
              const mCount = Array.isArray(t.members) ? t.members.length : 1;

              return (
                <button
                  key={t._id}
                  onClick={() => setSelectedTeamId(t._id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#17130A] border-[#F59E0B] shadow-lg shadow-amber-500/10'
                      : 'bg-[#070D18] border-[#1E293B] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isLeader ? 'bg-[#261E0C] text-[#FBBF24] border border-[#785412]' : 'bg-[#0F172A] text-[#CBD5E1]'
                    }`}>
                      {isLeader ? '👑 Leader' : '⚡ Member'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {mCount}/6 Members
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                  <p className="text-[11px] font-mono text-[#94A3B8] truncate mt-0.5">
                    PS: {t.psCode || 'SIH2026'} • {t.sihTheme}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Team Header Banner */}
      <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Top Badges & Member Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] font-mono text-xs font-bold px-3 py-1 rounded-xl">
              {activeTeam.sihTheme || 'SIH Theme'}
            </span>
            <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] font-mono text-xs font-bold px-3 py-1 rounded-xl">
              PS: {activeTeam.psCode || 'SIH2026'}
            </span>
            <span className="bg-[#070D18] border border-[#334155] text-[#CBD5E1] font-mono text-xs px-2.5 py-1 rounded-xl">
              {activeTeam.categoryEdition || 'Software Edition'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Leader Management Action Buttons */}
            {leaderObj && localUser && (
              (leaderObj._id && leaderObj._id.toString() === localUser._id?.toString()) ||
              (leaderObj.email && localUser.email && leaderObj.email.toLowerCase() === localUser.email.toLowerCase()) ||
              (activeTeam.leaderName && localUser.name && activeTeam.leaderName.toLowerCase() === localUser.name.toLowerCase()) ||
              (activeTeam.leader && activeTeam.leader.toString() === localUser._id?.toString())
            ) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditModal}
                  className="bg-[#070D18] hover:bg-[#1E293B] border border-[#334155] hover:border-amber-500 text-xs font-mono text-amber-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  ⚙️ Edit Squad
                </button>
                <button
                  onClick={handleDeleteTeam}
                  className="bg-[#3B1115] hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  🗑️ Delete Squad
                </button>
              </div>
            )}

            <span className="bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399] font-mono text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              {memberCount}/{maxMembers} MEMBERS CONFIRMED
            </span>
          </div>
        </div>

        {/* Team Title & Info */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{activeTeam.name}</h1>
          <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-3xl leading-relaxed">
            {activeTeam.problemStatementTitle || activeTeam.description}
          </p>
          {activeTeam.organization && (
            <p className="text-xs font-mono text-[#94A3B8] pt-1">
              🏛️ Ministry / Organization: <span className="text-white font-bold">{activeTeam.organization}</span>
            </p>
          )}
        </div>

        {/* Privacy Assurance Pill */}
        <div className="bg-[#070D18] border border-[#1E293B] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono text-[#CBD5E1] relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🔒</span>
            <span>Private Squad Portal • Member contact emails are visible exclusively to confirmed teammates.</span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold uppercase">CONFIRMED ACCESS</span>
        </div>
      </div>

      {/* 2. Confirmed Member List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
              CONFIRMED SQUAD ROSTER ({memberCount} OF {maxMembers})
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Team Members</h2>
          </div>
          <Link
            to="/requests"
            className="text-xs bg-[#070D18] hover:bg-[#0B132B] border border-[#334155] text-[#CBD5E1] hover:text-white px-3.5 py-2 rounded-xl font-mono font-bold transition-all"
          >
            Review Join Requests →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueMembers.map((member, idx) => {
            const memberName = member.name || (member.isLeader ? 'Squad Leader' : `Teammate ${idx + 1}`);
            const memberInitials = memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const isUserHimself = localUser && (localUser._id === member._id || localUser.name === member.name || (localUser.email && localUser.email === member.email));
            const isCallerLeader = Boolean(
              leaderObj && localUser && (
                (leaderObj._id && leaderObj._id.toString() === localUser._id?.toString()) ||
                (leaderObj.email && localUser.email && leaderObj.email.toLowerCase() === localUser.email.toLowerCase()) ||
                (activeTeam.leaderName && localUser.name && activeTeam.leaderName.toLowerCase() === localUser.name.toLowerCase()) ||
                (activeTeam.leader && activeTeam.leader.toString() === localUser._id?.toString())
              )
            );

            return (
              <div
                key={member._id || idx}
                className={`bg-[#0B132B] border rounded-2xl p-5 space-y-4 shadow-xl transition-all ${
                  member.isLeader 
                    ? 'border-[#F59E0B]/70 shadow-amber-500/10' 
                    : 'border-[#1E293B] hover:border-[#334155]'
                }`}
              >
                {/* Member Top Line: Role & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {member.isLeader ? (
                      <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        👑 Squad Leader
                      </span>
                    ) : (
                      <span className="bg-[#070D18] border border-[#334155] text-[#CBD5E1] text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg">
                        ⚡ {member.primaryRole || 'Squad Member'}
                      </span>
                    )}

                    {isUserHimself && (
                      <span className="bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCallerLeader && !member.isLeader && (
                      <button
                        onClick={() => handleKickMember(member._id, memberName)}
                        className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-200 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        ✕ Kick
                      </button>
                    )}

                    {member.gender && (
                      <span className="text-[10px] font-mono text-[#94A3B8] bg-[#070D18] px-2 py-0.5 rounded border border-[#1E293B]">
                        {member.gender}
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Name & Academic Details */}
                <div className="flex items-start gap-3.5">
                  {member.photoUrl || member.avatar ? (
                    <img
                      src={member.photoUrl || member.avatar}
                      alt={memberName}
                      className="w-12 h-12 rounded-xl object-cover border border-[#F59E0B]/50 shadow-md"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-base shadow-md">
                      {memberInitials}
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <h3 className="font-black text-white text-base leading-tight">{memberName}</h3>
                    <p className="text-xs text-[#E2E8F0] font-medium">
                      🎓 {member.college || 'College / Institute'}
                    </p>
                    <p className="text-[11px] font-mono text-[#CBD5E1]">
                      {member.year || '3rd Year'} • {member.classBranch || 'Computer Science'}{member.section ? ` (${member.section})` : ''}
                    </p>
                  </div>
                </div>

                {/* Email Address (Private, high contrast, copyable) */}
                <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-amber-400 text-xs">✉️</span>
                    <span className="text-xs font-mono font-bold text-white truncate select-all">
                      {member.email || 'teammate@college.edu'}
                    </span>
                  </div>
                  {member.email && (
                    <button
                      onClick={() => copyEmailToClipboard(member.email, memberName)}
                      className="text-[10px] font-mono font-bold text-[#FBBF24] hover:underline bg-[#17130A] border border-[#785412] px-2 py-1 rounded cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Copy
                    </button>
                  )}
                </div>

                {/* WhatsApp Number if exists */}
                {member.whatsappNumber && (
                  <div className="bg-[#070D18] border border-[#1E293B] px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-mono text-[#34D399]">
                    <span>📱 WhatsApp:</span>
                    <span className="text-white font-bold">{member.whatsappNumber}</span>
                  </div>
                )}

                {/* Skill Tags */}
                {((member.technicalSkills && member.technicalSkills.length > 0) || (member.capabilities && member.capabilities.length > 0)) && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#94A3B8] block uppercase font-bold">SKILLS & CAPABILITIES</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(member.capabilities || []), ...(member.technicalSkills || [])].slice(0, 5).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-[10px] font-mono px-2 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Handles */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#1E293B] text-xs font-mono">
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noreferrer" className="text-[#CBD5E1] hover:text-white transition-colors">
                      🐙 GitHub
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline">
                      💼 LinkedIn
                    </a>
                  )}
                  {member.leetcodeRating && member.leetcodeRating !== 'N/A' && (
                    <span className="text-amber-400 font-bold">
                      🏆 {member.leetcodeRating}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Team Chat (Socket.io room-per-teamId for active squad) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
              REAL-TIME SQUAD CHAT ({activeTeam.name})
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Team Discussion</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
              socketConnected 
                ? 'bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399]' 
                : 'bg-[#261E0C] border border-[#785412] text-[#FBBF24]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#34D399] animate-pulse' : 'bg-amber-400'}`} />
              {socketConnected ? 'Live Squad Room' : 'Connecting Chat...'}
            </span>
          </div>
        </div>

        {/* Chat Box Container */}
        <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl shadow-2xl flex flex-col h-[480px] overflow-hidden">
          
          {/* 3-Day Retention Notice Bar */}
          <div className="bg-[#070D18] border-b border-[#1E293B] px-5 py-2 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs">🕒</span>
              <span className="text-[#CBD5E1]">Chat history is automatically deleted after 3 days.</span>
            </div>
            <span className="text-[10px] bg-[#17130A] border border-[#785412] text-[#FBBF24] px-2 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline-block">
              3-Day Retention
            </span>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
                <div className="text-3xl">💬</div>
                <p className="text-xs text-[#CBD5E1] font-medium">No messages yet in this squad room.</p>
                <p className="text-[11px] text-[#94A3B8]">Say hello to coordinate your SIH presentation & code repository!</p>
              </div>
            ) : (
              messages.map((msg, mIdx) => {
                const isMe = localUser && (localUser._id === msg.user?._id || localUser.name === msg.user?.name);
                const senderName = msg.user?.name || 'Teammate';
                const senderRole = msg.user?.role || 'Member';
                const timeStr = msg.createdAt 
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now';

                return (
                  <div
                    key={msg._id || mIdx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-white">{senderName}</span>
                      <span className="text-[9px] font-mono bg-[#070D18] border border-[#334155] text-[#CBD5E1] px-1.5 py-0.2 rounded">
                        {senderRole}
                      </span>
                      <span className="text-[9px] font-mono text-[#94A3B8]">{timeStr}</span>
                    </div>

                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#F59E0B] text-[#000000] font-semibold rounded-tr-none shadow-md shadow-amber-500/10'
                          : 'bg-[#070D18] border border-[#334155] text-white rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-[#070D18] border-t border-[#1E293B] flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={`Message ${activeTeam.name} squad members...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-[#0B132B] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder-[#94A3B8]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-black font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Send ✈
            </button>
          </form>

        </div>
      </div>

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchMyTeams()}
      />

      {/* Leader Edit Squad Details Modal */}
      {isEditingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans">
          <div className="bg-[#0B132B] border border-[#F59E0B]/50 rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 overflow-hidden text-white">
            <div className="bg-[#050A14] border-b border-[#1E293B] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-base">
                  ⚙️
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Edit Squad Details</h2>
                  <p className="text-[11px] font-mono text-[#CBD5E1]">Update Problem Statement & Information</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingTeam(false)}
                className="text-[#94A3B8] hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">Squad Name</label>
                <input
                  type="text"
                  required
                  value={editTeamForm.name}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">PS Code</label>
                  <input
                    type="text"
                    required
                    value={editTeamForm.psCode}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, psCode: e.target.value })}
                    className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">SIH Theme</label>
                  <input
                    type="text"
                    value={editTeamForm.sihTheme}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, sihTheme: e.target.value })}
                    className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">Problem Statement Title</label>
                <input
                  type="text"
                  required
                  value={editTeamForm.problemStatementTitle}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, problemStatementTitle: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">Ministry / Organization</label>
                <input
                  type="text"
                  value={editTeamForm.organization}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, organization: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#CBD5E1] mb-1 font-bold">Squad Description & Roadmap</label>
                <textarea
                  rows={3}
                  required
                  value={editTeamForm.description}
                  onChange={(e) => setEditTeamForm({ ...editTeamForm, description: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsEditingTeam(false)}
                  className="bg-[#070D18] hover:bg-[#1E293B] border border-[#334155] text-[#CBD5E1] text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyTeam;
