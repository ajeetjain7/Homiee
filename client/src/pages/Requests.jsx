import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Requests = () => {
  const [tab, setTab] = useState('received');
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [incomingTeamRequests, setIncomingTeamRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const user = (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const token = localStorage.getItem('token');

  // Fetch all incoming requests and invitations
  const fetchAllRequests = useCallback(async () => {
    if (!user?._id && !user?.email && !user?.name) {
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          userId: user._id,
          email: user.email,
          userName: user.name
        }
      };

      // 1. Fetch direct invitations sent to this user from /api/requests/incoming
      try {
        const res = await axios.get(`${API_BASE}/api/requests/incoming`, config);
        console.log('📌 [LOG POINT 4: FRONTEND RECEIVED INCOMING REQUESTS]:', res.data);
        setIncomingInvites(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn('Could not fetch /api/requests/incoming:', err);
      }

      // 2. Fetch applications sent to teams led by this user from /api/teams
      try {
        const teamsRes = await axios.get(`${API_BASE}/api/teams/team`, config);
        const mySquads = teamsRes.data?.teams || (teamsRes.data?.team ? [teamsRes.data.team] : []);
        const pendingSquadReqs = mySquads.flatMap(t => 
          (t.requests || []).filter(r => r.status === 'pending').map(r => ({
            ...r,
            teamId: t._id,
            teamName: t.name,
            psCode: t.psCode,
            isTeamApplication: true
          }))
        );
        setIncomingTeamRequests(pendingSquadReqs);
      } catch (err) {
        console.warn('Could not fetch team applicant requests:', err);
      }

      // 3. Fetch sent requests from /api/requests/sent
      try {
        const sentRes = await axios.get(`${API_BASE}/api/requests/sent`, config);
        console.log('🚀 [Requests.jsx] Sent requests received from /api/requests/sent:', sentRes.data);
        setSentRequests(Array.isArray(sentRes.data) ? sentRes.data : []);
      } catch (err) {
        console.warn('Could not fetch /api/requests/sent:', err);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.email, user?.name, token]);

  useEffect(() => {
    fetchAllRequests();

    // Auto-refetch on window focus or visibility change
    const onFocus = () => fetchAllRequests();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(fetchAllRequests, 8000); // 8s live polling

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchAllRequests]);

  // Accept or reject an incoming direct invitation
  const handleInviteAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.patch(`${API_BASE}/api/requests/${requestId}`, { action }, config);

      if (action === 'accept') {
        toast.success(`🎉 Invitation accepted! You are now part of ${res.data?.request?.teamName || 'the squad'}.`);
      } else {
        toast.success('Invitation declined.');
      }
      fetchAllRequests();
    } catch (err) {
      console.error('Action error:', err);
      toast.error(err.response?.data?.message || `Failed to ${action} invitation.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Accept or reject a team applicant request
  const handleTeamApplicantAction = async (teamId, requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await axios.post(`${API_BASE}/api/teams/${teamId}/request/${requestId}/action`, { action, userId: user?._id });
      toast.success(res.data?.message || `Applicant request ${action}ed!`);
      fetchAllRequests();
    } catch (err) {
      console.error('Applicant action error:', err);
      toast.error(err.response?.data?.message || 'Failed to process action.');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const allIncoming = [...incomingInvites, ...incomingTeamRequests];

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-[#F8FAFC] select-none pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
            SIH 2026 CONNECTION HUB
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Requests & Invitations</h1>
          <p className="text-xs text-[#CBD5E1]">Manage incoming squad recruitments and outgoing join requests.</p>
        </div>

        <button
          onClick={fetchAllRequests}
          className="self-start sm:self-auto bg-[#0B132B] hover:bg-[#16223D] border border-[#334155] text-[#CBD5E1] hover:text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1E293B] pb-3">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            tab === 'received'
              ? 'bg-[#F59E0B] text-black shadow-md shadow-amber-500/20'
              : 'bg-[#0B132B] text-[#CBD5E1] hover:text-white border border-[#1E293B]'
          }`}
        >
          <span>📬 Received Invitations</span>
          {allIncoming.length > 0 && (
            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
              tab === 'received' ? 'bg-black text-[#F59E0B]' : 'bg-[#F59E0B] text-black'
            }`}>
              {allIncoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            tab === 'sent'
              ? 'bg-[#F59E0B] text-black shadow-md shadow-amber-500/20'
              : 'bg-[#0B132B] text-[#CBD5E1] hover:text-white border border-[#1E293B]'
          }`}
        >
          <span>🚀 Sent Requests & Invites</span>
          {sentRequests.length > 0 && (
            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
              tab === 'sent' ? 'bg-black text-[#F59E0B]' : 'bg-[#334155] text-white'
            }`}>
              {sentRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#0B132B] border border-[#1E293B] p-8 rounded-2xl text-center space-y-2">
          <div className="animate-spin text-2xl mx-auto w-6 h-6">⏳</div>
          <p className="text-xs text-[#CBD5E1] font-mono">Syncing SIH connection inbox...</p>
        </div>
      )}

      {/* Tab 1: RECEIVED INVITATIONS & APPLICATIONS */}
      {!loading && tab === 'received' && (
        <div className="space-y-4">
          {allIncoming.length === 0 ? (
            <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-12 text-center space-y-3">
              <div className="text-4xl">📭</div>
              <h3 className="text-lg font-black text-white">No Pending Invitations</h3>
              <p className="text-xs text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                You don't have any incoming squad invitations right now. Complete your profile in <Link to="/profile" className="text-amber-400 underline font-bold">Profile Settings</Link> to be discovered by team leaders, or explore open squads.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  to="/teams"
                  className="bg-[#F59E0B] hover:bg-[#E08D00] text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  🔍 Explore Open Squads
                </Link>
                <Link
                  to="/teammates"
                  className="bg-[#070D18] border border-[#334155] hover:border-gray-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  ⚡ Find Innovators
                </Link>
              </div>
            </div>
          ) : (
            allIncoming.map((item) => {
              const isDirectInvite = !item.isTeamApplication;
              const isActionInProgress = actionLoading[item._id];

              return (
                <div
                  key={item._id}
                  className="bg-[#0B132B] border border-[#1E293B] hover:border-[#F59E0B]/50 p-5 rounded-2xl space-y-4 shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg">
                        {isDirectInvite ? '⚡ SQUAD INVITATION' : '📝 JOIN APPLICATION'}
                      </span>
                      {item.psCode && (
                        <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
                          PS: {item.psCode}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        {isDirectInvite ? item.teamName : item.userName}
                      </h3>
                      {isDirectInvite && (
                        <span className="text-xs text-[#CBD5E1] font-mono">
                          (by <span className="text-white font-bold">{item.fromUserName || 'Squad Leader'}</span>)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#CBD5E1]">
                      Target Role: <span className="text-amber-400 font-bold">{item.role || 'Squad Member'}</span>
                    </p>

                    {/* Message / Pitch */}
                    {(item.message || item.pitchNote) && (
                      <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl text-xs text-[#E2E8F0] italic mt-2">
                        "{item.message || item.pitchNote}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      Status: <span className="text-amber-400 font-bold uppercase">{item.status}</span>
                    </span>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => 
                          isDirectInvite
                            ? handleInviteAction(item._id, 'accept')
                            : handleTeamApplicantAction(item.teamId, item._id, 'accept')
                        }
                        disabled={isActionInProgress}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        ✓ Accept & Join
                      </button>

                      <button
                        onClick={() => 
                          isDirectInvite
                            ? handleInviteAction(item._id, 'reject')
                            : handleTeamApplicantAction(item.teamId, item._id, 'reject')
                        }
                        disabled={isActionInProgress}
                        className="bg-[#070D18] hover:bg-rose-950/50 border border-[#334155] hover:border-rose-700/50 text-[#CBD5E1] hover:text-rose-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: SENT REQUESTS */}
      {!loading && tab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-12 text-center space-y-3">
              <div className="text-4xl">🚀</div>
              <h3 className="text-lg font-black text-white">No Sent Requests</h3>
              <p className="text-xs text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                You haven't sent any invitations or join requests yet. Browse candidate innovators or apply to open squads.
              </p>
              <div className="pt-2">
                <Link
                  to="/teammates"
                  className="bg-[#F59E0B] hover:bg-[#E08D00] text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md inline-block"
                >
                  ⚡ Find Innovators to Invite
                </Link>
              </div>
            </div>
          ) : (
            sentRequests.map((req) => (
              <div
                key={req._id}
                className="bg-[#0B132B] border border-[#1E293B] p-5 rounded-2xl space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] text-xs font-mono font-bold px-2 py-0.5 rounded">
                      {req.type === 'invite' ? 'SQUAD INVITATION SENT' : 'JOIN APPLICATION SENT'}
                    </span>
                    <span className="text-xs text-[#CBD5E1] font-mono">
                      To: <span className="text-white font-bold">{req.toUserName}</span>
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    req.status === 'accepted' 
                      ? 'bg-[#0E3A2F] border-[#059669]/60 text-[#34D399]' 
                      : req.status === 'rejected'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-[#261E0C] border-[#785412] text-[#FBBF24]'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">{req.teamName} ({req.psCode || 'SIH2026'})</h4>
                  <p className="text-xs text-[#CBD5E1]">
                    Invited for Role: <span className="text-amber-400 font-bold">{req.role}</span>
                  </p>
                  {req.message && (
                    <p className="text-xs text-[#94A3B8] italic bg-[#070D18] p-2.5 rounded-xl border border-[#1E293B]">
                      "{req.message}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default Requests;