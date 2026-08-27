import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreateTeam = () => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [form, setForm] = useState({
    name: '',
    sihTheme: 'Agriculture & Rural Development',
    categoryEdition: 'Software Edition',
    organization: '',
    psCode: '',
    problemStatementTitle: '',
    tagline: '',
    description: ''
  });

  const [vacancies, setVacancies] = useState([
    { roleName: 'Backend Developer', status: 'Vacant' },
    { roleName: 'AI/ML Engineer', status: 'Vacant' },
    { roleName: 'UI/UX Designer', status: 'Vacant' }
  ]);

  const [selectedRoleInput, setSelectedRoleInput] = useState('IoT & Hardware Engineer');

  const [criticalSkills, setCriticalSkills] = useState([
    { skillName: 'Python', priority: 'CRITICAL' },
    { skillName: 'React', priority: 'PREFERRED' },
    { skillName: 'PostgreSQL', priority: 'PREFERRED' }
  ]);

  const [skillInput, setSkillInput] = useState('');
  const [skillPriority, setSkillPriority] = useState('CRITICAL');

  const handleAddVacancy = () => {
    if (!selectedRoleInput) return;
    setVacancies([...vacancies, { roleName: selectedRoleInput, status: 'Vacant' }]);
  };

  const handleRemoveVacancy = (index) => {
    setVacancies(vacancies.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    setCriticalSkills([...criticalSkills, { skillName: skillInput.trim(), priority: skillPriority }]);
    setSkillInput('');
  };

  const handleRemoveSkill = (index) => {
    setCriticalSkills(criticalSkills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.psCode || !form.problemStatementTitle || !form.description) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      await axios.post(`${API_BASE}/api/teams/create`, {
        ...form,
        vacancies,
        criticalSkills,
        userId: user._id || 'user_sih_2026',
        userName: user.name || 'Student Innovator',
        email: user.email || ''
      }, config);

      toast.success('🎉 SIH Squad published successfully!');
      window.location.href = '/my-team';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white p-4 md:p-8 font-sans relative overflow-hidden select-none">
      
      {/* Background Grid Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B40_1px,transparent_1px),linear-gradient(to_bottom,#1E293B40_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {/* Top Pill Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#17130A] border border-dashed border-[#F59E0B]/60 text-[#F59E0B] font-mono text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
            🏆 SMART INDIA HACKATHON 2026 SQUAD BUILDER
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Form Your SIH Team</h1>
          <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Assemble a balanced squad of up to 6 innovators, define your target SIH problem statement, and eliminate team skill gaps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 text-xs">
          
          {/* SECTION 1: SIH Theme & Problem Statement */}
          <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-5 backdrop-blur-xl">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gray-600" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gray-600" />

            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span>🏛️</span> <span>1. SIH Theme & Problem Statement</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#34D399] bg-[#0E3A2F] border border-[#059669]/40 px-2 py-0.5 rounded">
                OFFICIAL SIH CONTEXT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">SIH Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriTech Pioneers"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">SIH Theme / Category *</label>
                <select
                  value={form.sihTheme}
                  onChange={(e) => setForm({ ...form, sihTheme: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                >
                  <option value="Agriculture & Rural Development">Agriculture & Rural Development</option>
                  <option value="MedTech & BioTech Healthcare">MedTech & BioTech Healthcare</option>
                  <option value="Clean & Renewable Green Technology">Clean & Renewable Green Technology</option>
                  <option value="Smart Automation, IoT & Robotics">Smart Automation, IoT & Robotics</option>
                  <option value="Cybersecurity & Disaster Management">Cybersecurity & Disaster Management</option>
                </select>
              </div>
            </div>

            {/* Edition Toggle Switches */}
            <div>
              <label className="block text-gray-400 mb-2 font-medium">SIH Category Edition</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, categoryEdition: 'Software Edition' })}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    form.categoryEdition === 'Software Edition'
                      ? 'bg-[#261E0C] border border-[#785412] text-[#FBBF24]'
                      : 'bg-[#070D18] border border-gray-800 text-gray-400'
                  }`}
                >
                  &lt;/&gt; Software Edition
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, categoryEdition: 'Hardware Edition' })}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    form.categoryEdition === 'Hardware Edition'
                      ? 'bg-[#261E0C] border border-[#785412] text-[#FBBF24]'
                      : 'bg-[#070D18] border border-gray-800 text-gray-400'
                  }`}
                >
                  ⚙ Hardware Edition
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Ministry / Organization (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Agriculture / ISRO"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">SIH PS Code *</label>
                <input
                  type="text"
                  required
                  placeholder="SIH-1420"
                  value={form.psCode}
                  onChange={(e) => setForm({ ...form, psCode: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Problem Statement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI-Powered Crop Disease Detection and Local Market Support"
                value={form.problemStatementTitle}
                onChange={(e) => setForm({ ...form, problemStatementTitle: e.target.value })}
                className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Tagline / Mission Pitch</label>
              <input
                type="text"
                placeholder="e.g. Building edge AI computer vision models for rural Indian farmers"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Detailed Project & Team Pitch *</label>
              <textarea
                rows="4"
                required
                placeholder="Describe your technical architecture, expected prototype deliverables for SIH evaluation, and what specific gaps you need help filling..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#070D18] border border-gray-700/80 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* SECTION 2: Required Squad Vacancies */}
          <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span>👥</span> <span>2. Required Squad Vacancies</span>
              </div>
              <span className="text-[10px] font-mono text-[#FBBF24] bg-[#261E0C] border border-[#785412] px-2.5 py-0.5 rounded font-bold">
                Current Squad Plan: {vacancies.length + 1}/6 Members
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRoleInput}
                onChange={(e) => setSelectedRoleInput(e.target.value)}
                className="flex-1 bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer"
              >
                <option value="IoT & Hardware Engineer">IoT & Hardware Engineer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Cybersecurity Specialist">Cybersecurity Specialist</option>
              </select>
              <button
                type="button"
                onClick={handleAddVacancy}
                className="bg-[#FF7A00] hover:bg-[#E06D00] text-black font-bold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                + Add Role Vacancy
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {/* Leader Row */}
              <div className="bg-[#18150D] border border-amber-900/40 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{user.name || 'Vikramaditya Rathore'}</span>
                  <span className="text-[10px] text-amber-400 font-mono">(Leader)</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">Filled</span>
              </div>

              {/* Dynamic Vacancy Rows */}
              {vacancies.map((v, idx) => (
                <div key={idx} className="bg-[#070D18] border border-gray-800 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{v.roleName}</span>
                    <span className="text-[10px] text-amber-400 font-mono">1 Vacancy to Recruit</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVacancy(idx)}
                    className="text-gray-500 hover:text-rose-400 font-bold p-1 cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Critical Technical Skills */}
          <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-gray-800/80">
              <span>&lt;/&gt;</span> <span>3. Critical Technical Skills for Matching Engine</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PyTorch, YOLO, React, ROS..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 bg-[#070D18] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#F59E0B]"
              />
              <select
                value={skillPriority}
                onChange={(e) => setSkillPriority(e.target.value)}
                className="bg-[#070D18] border border-gray-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer"
              >
                <option value="CRITICAL">🔴 Critical (Must Have)</option>
                <option value="PREFERRED">🟡 Preferred</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                + Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {criticalSkills.map((s, idx) => (
                <span
                  key={idx}
                  className={`border px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-2 ${
                    s.priority === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  }`}
                >
                  <span>{s.skillName}</span>
                  <span className="text-[9px] uppercase font-bold">{s.priority}</span>
                  <button type="button" onClick={() => handleRemoveSkill(idx)} className="text-gray-400 hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-6 py-3.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF7A00] hover:bg-[#E06D00] text-black font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              ⚡ Launch Squad & Find Teammates
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateTeam;