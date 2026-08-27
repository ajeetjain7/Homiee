import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Requests = () => {
  const [tab, setTab] = useState('sent');
  const [myTeams, setMyTeams] = useState([]);
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchMyTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams');
      setMyTeams(res.data.filter(t => (t.leader?._id || t.leader) === user._id || t.members?.some(m => (m._id || m) === user._id)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const handleAction = async (teamId, requestId, action) => {
    try {
      await axios.post(`http://localhost:5000/api/teams/${teamId}/request/${requestId}/action`, { action });
      toast.success(`Request ${action}ed!`);
      fetchMyTeams();
    } catch (err) {
      toast.error('Failed to process action.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">SIH 2026 CONNECTION CENTER</span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Requests & Squad Invitations</h1>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('received')} className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${tab === 'received' ? 'bg-[#FF7A00] text-black' : 'bg-[#0B132B] text-gray-400'}`}>
          📬 Received Invitations
        </button>
        <button onClick={() => setTab('sent')} className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${tab === 'sent' ? 'bg-[#FF7A00] text-black' : 'bg-[#0B132B] text-gray-400'}`}>
          🚀 Sent Join Requests
        </button>
      </div>

      {tab === 'received' ? (
        <div className="space-y-3">
          {myTeams.flatMap(t => (t.requests || []).filter(r => r.status === 'pending').map(r => ({ ...r, teamId: t._id, teamName: t.name }))).map((r) => (
            <div key={r._id} className="bg-[#0B132B] border border-gray-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">{r.userName}</span>
                <p className="text-xs text-gray-400 mt-0.5">Applying for <span className="text-amber-400 font-bold">{r.role}</span> in <span className="text-white font-bold">{r.teamName}</span></p>
                {r.pitchNote && <p className="text-xs text-gray-300 italic mt-2 bg-[#070D18] p-2 rounded-lg">"{r.pitchNote}"</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(r.teamId, r._id, 'accept')} className="bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-xl">✓ Accept</button>
                <button onClick={() => handleAction(r.teamId, r._id, 'reject')} className="bg-rose-950 text-rose-300 font-bold text-xs px-3 py-2 rounded-xl">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B132B] border border-gray-800 p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs bg-amber-500/10 text-amber-400 font-mono px-2.5 py-1 rounded border border-amber-500/30">PENDING</span>
            <button onClick={() => window.location.href = '/dashboard/my-team'} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg">View Squad</button>
          </div>
          <h3 className="font-bold text-white text-lg">Request sent to EduSphere AI</h3>
          <p className="text-xs text-gray-400">Applied Role: <span className="text-amber-400 font-bold">Fullstack Developer</span> • Leader: Kavya Nair</p>
          <p className="text-xs text-gray-300 italic bg-[#070D18] p-3 rounded-xl border border-gray-800/80">"Hi Kavya Nair! I would love to join EduSphere AI for SIH1610 as a Fullstack Developer."</p>
        </div>
      )}
    </div>
  );
};

export default Requests;