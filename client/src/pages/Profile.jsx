import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {
        _id: 'user_sih_2026',
        name: 'Vikramaditya Rathore',
        email: 'vikram.sih2026@gmail.com',
        college: 'College / Institute',
        yearAndBranch: '3rd Year (Computer Science & Engineering)',
        primaryRole: 'Fullstack Developer',
        status: 'Looking for Team',
        technicalSkills: [],
        featuredProjects: [],
        sihThemes: [],
        hackathonsCount: 0
      };
    } catch {
      return { _id: 'user_sih_2026', name: 'Vikramaditya Rathore', email: 'vikram.sih2026@gmail.com' };
    }
  });

  const [form, setForm] = useState(user);
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', link: '', description: '' });

  // Calculate Readiness Percentage dynamically based on profile completeness
  const calculateReadiness = () => {
    let score = 20; // Base score
    if (user.technicalSkills && user.technicalSkills.length >= 3) score += 30;
    if (user.sihThemes && user.sihThemes.length > 0) score += 25;
    if (user.featuredProjects && user.featuredProjects.length > 0) score += 15;
    if (user.hackathonsCount > 0) score += 10;
    return Math.min(score, 100);
  };

  const readinessScore = calculateReadiness();

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', {
        userId: user._id,
        ...form
      });
      setUser(res.data);
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setUser(form);
      localStorage.setItem('userInfo', JSON.stringify(form));
      setIsEditing(false);
      toast.success('Profile saved locally!');
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const updatedSkills = [...(form.technicalSkills || []), newSkill.trim()];
    setForm({ ...form, technicalSkills: updatedSkills });
    setNewSkill('');
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    const updatedProjects = [...(form.featuredProjects || []), newProject];
    setForm({ ...form, featuredProjects: updatedProjects });
    setNewProject({ title: '', link: '', description: '' });
  };

  const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'VR';

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-white select-none">
      
      {/* 1. Header Profile Banner */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 md:p-8 relative shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#2DD4BF] text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-teal-500/10">
              {userInitials}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user.name}</h1>
                <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-bold px-3 py-1 rounded-md">
                  {user.primaryRole || 'Fullstack Developer'}
                </span>
                <span className="bg-[#0E3A2F] border border-[#059669]/40 text-[#34D399] text-xs font-mono font-bold px-3 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                  {user.status || 'Looking for Team'}
                </span>
              </div>

              <p className="text-xs text-gray-400">
                🎓 {user.college || 'College / Institute'} • {user.yearAndBranch || '3rd Year (Computer Science & Engineering)'}
              </p>
              <p className="text-xs font-mono text-gray-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setForm(user);
              setIsEditing(true);
            }}
            className="bg-[#0F182E] hover:bg-[#16223D] border border-gray-700/80 text-gray-200 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            ✏ Edit Profile
          </button>
        </div>

        {/* Top 4 Metrics Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-800/80">
          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#F59E0B]">{user.technicalSkills?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Technical Skills</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#F59E0B]">{user.featuredProjects?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Featured Projects</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#F59E0B]">{user.hackathonsCount || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">Hackathons</div>
          </div>

          <div className="bg-[#070D18] border border-gray-800/80 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-[#38BDF8]">{user.sihThemes?.length || 0}</div>
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">SIH Domains</div>
          </div>
        </div>
      </div>

      {/* 2. SIH Profile Readiness Indicator */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <h3 className="text-sm font-bold text-white tracking-wide">SIH Profile Readiness</h3>
            <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded">
              {readinessScore}% COMPLETE
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Higher profile readiness increases your discovery ranking by up to <span className="text-amber-400 font-bold">3.5x</span> in team match recommendations.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-[#070D18] h-2 rounded-full overflow-hidden border border-gray-800">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        {/* Action Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.technicalSkills?.length >= 3 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.technicalSkills?.length >= 3 ? '✓' : '⏱'}</span>
            <span>Add 3+ Technical Skills</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.sihThemes?.length > 0 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.sihThemes?.length > 0 ? '✓' : '⏱'}</span>
            <span>Add SIH Themes</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.featuredProjects?.length > 0 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.featuredProjects?.length > 0 ? '✓' : '⚠️'}</span>
            <span>Add Featured Project (+10%)</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${user.hackathonsCount > 0 ? 'bg-[#0E3A2F] border-[#059669]/40 text-[#34D399]' : 'bg-[#070D18] border-gray-800 text-gray-400'}`}>
            <span>{user.hackathonsCount > 0 ? '✓' : '⚪'}</span>
            <span>Hackathon Record</span>
          </div>
        </div>
      </div>

      {/* 3. Content Sections (Skills & Featured Projects Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Skills & Proficiency Card */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-amber-400 font-mono font-bold">&lt;/&gt;</span>
            <h3 className="text-sm font-bold text-white tracking-wide">Skills & Proficiency</h3>
          </div>

          {user.technicalSkills && user.technicalSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.technicalSkills.map((skill, idx) => (
                <span key={idx} className="bg-[#070D18] border border-gray-700/80 text-gray-200 text-xs font-mono px-3 py-1.5 rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No skills added yet — edit profile to add your technical skills.</p>
          )}
        </div>

        {/* Featured Projects Card */}
        <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
            <span className="text-amber-400">📁</span>
            <h3 className="text-sm font-bold text-white tracking-wide">Featured Projects</h3>
          </div>

          {user.featuredProjects && user.featuredProjects.length > 0 ? (
            <div className="space-y-3">
              {user.featuredProjects.map((p, idx) => (
                <div key={idx} className="bg-[#070D18] border border-gray-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-white">{p.title}</span>
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-cyan-400 text-[10px] hover:underline">🔗 View Repo</a>}
                  </div>
                  <p className="text-xs text-gray-400">{p.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No projects added yet.</p>
          )}
        </div>

      </div>

      {/* 4. Interested SIH Themes Section */}
      <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800/80">
          <span className="text-rose-400">🎯</span>
          <h3 className="text-sm font-bold text-white tracking-wide">Interested SIH Themes</h3>
        </div>

        {user.sihThemes && user.sihThemes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.sihThemes.map((t, idx) => (
              <span key={idx} className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-xs font-mono font-semibold px-3 py-1.5 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No themes selected yet — this helps teams find you for the right problem statement.</p>
        )}
      </div>

      {/* Edit Profile Popup Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0B132B] border border-gray-800 p-6 rounded-2xl max-w-xl w-full space-y-5 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Primary Role</label>
                <input
                  type="text"
                  value={form.primaryRole}
                  onChange={(e) => setForm({ ...form, primaryRole: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Add Skills Inputs */}
              <div>
                <label className="block text-gray-400 mb-1">Add Technical Skill</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. React, PyTorch, Node.js..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                  />
                  <button type="button" onClick={handleAddSkill} className="bg-amber-500 text-black font-bold px-4 rounded-xl">+ Add</button>
                </div>
              </div>

              {/* Add Project Inputs */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <label className="block text-gray-400 font-bold">Add Featured Project</label>
                <input
                  type="text"
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Short Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
                <input
                  type="url"
                  placeholder="GitHub / Repo Link"
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 rounded-xl px-3 py-2 text-white"
                />
                <button type="button" onClick={handleAddProject} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl">Add Project</button>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsEditing(false)} className="w-1/2 bg-gray-800 text-gray-300 font-bold py-2.5 rounded-xl">Cancel</button>
                <button type="button" onClick={handleSaveProfile} className="w-1/2 bg-[#FF7A00] text-black font-bold py-2.5 rounded-xl">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;