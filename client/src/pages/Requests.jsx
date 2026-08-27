import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const Requests = () => {
  const [tab, setTab] = useState('received');
  const [incomingRequests, setIncomingRequests] = useState([]);
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

  // Fetch all incoming and sent requests
  const fetchAllRequests = useCallback(async () => {
    if (!user?._id && !user?.email) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch incoming requests
      try {
        const res = await api.get('/api/requests/incoming');
        setIncomingRequests(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn('Could not fetch /api/requests/incoming:', err);
      }

      // 2. Fetch sent requests
      try {
        const sentRes = await api.get('/api/requests/sent');
        setSentRequests(Array.isArray(sentRes.data) ? sentRes.data : []);
      } catch (err) {
        console.warn('Could not fetch /api/requests/sent:', err);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.email]);

  useEffect(() => {
    fetchAllRequests();

    // Auto-refetch on window focus or 8s interval
    const onFocus = () => fetchAllRequests();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(fetchAllRequests, 8000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchAllRequests]);

  // Accept or reject an incoming invitation / request
  const handleAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.patch(`/api/requests/${requestId}`, { action });

      if (action === 'accept') {
        toast.success(res.data?.message || '🎉 Successfully accepted!');
      } else {
        toast.success('Request declined.');
      }
      fetchAllRequests();
    } catch (err) {
      console.error('Action error:', err);
      toast.error(err.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

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
          <span>📬 Received ({incomingRequests.length})</span>
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            tab === 'sent'
              ? 'bg-[#F59E0B] text-black shadow-md shadow-amber-500/20'
              : 'bg-[#0B132B] text-[#CBD5E1] hover:text-white border border-[#1E293B]'
          }`}
        >
          <span>🚀 Sent ({sentRequests.length})</span>
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
          {incomingRequests.length === 0 ? (
            <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-12 text-center space-y-3">
              <div className="text-4xl">📭</div>
              <h3 className="text-lg font-black text-white">No Pending Invitations</h3>
              <p className="text-xs text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                You don't have any incoming squad invitations or join requests right now. Complete your profile in <Link to="/profile" className="text-amber-400 underline font-bold">Profile Settings</Link> to be discovered by team leaders, or explore open squads.
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
            incomingRequests.map((item) => {
              const isDirectInvite = item.type === 'invite';
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
                        {isDirectInvite ? item.teamName : item.fromUserName}
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

                    {item.proofOfWork && (
                      <p className="text-[11px] font-mono text-cyan-400 pt-1">
                        🔗 Proof of Work: <a href={item.proofOfWork} target="_blank" rel="noreferrer" className="underline">{item.proofOfWork}</a>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      Status: <span className="text-amber-400 font-bold uppercase">{item.status}</span>
                    </span>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleAction(item._id, 'accept')}
                        disabled={isActionInProgress}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        ✓ Accept & Join
                      </button>

                      <button
                        onClick={() => handleAction(item._id, 'reject')}
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
                    Role: <span className="text-amber-400 font-bold">{req.role}</span>
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