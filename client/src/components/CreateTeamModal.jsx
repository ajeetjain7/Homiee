import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const localUser = (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

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

  if (!isOpen) return null;

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
      toast.error('Please fill in all required fields (Name, PS Code, Title, Description).');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const payload = {
        ...form,
        vacancies,
        criticalSkills,
        userId: localUser._id || 'user_sih_2026',
        userName: localUser.name || 'Student Innovator',
        email: localUser.email || ''
      };

      const res = await axios.post('http://localhost:5000/api/teams/create', payload, config);

      toast.success('🎉 SIH Squad created successfully!');
      onClose();
      if (onSuccess) onSuccess(res.data);
      navigate('/team');
    } catch (err) {
      console.error('Create team error:', err);
      toast.error(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-[#0B132B] border border-[#F59E0B]/50 rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="bg-[#050A14] border-b border-[#1E293B] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-black font-black flex items-center justify-center text-sm shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-black text-white">Create SIH 2026 Squad</h2>
              <p className="text-[11px] text-[#94A3B8] font-mono">Define problem statement and post vacancies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-gray-500 text-[#CBD5E1] hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Section 1: Team & SIH Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1E293B] text-sm font-bold text-white">
              <span>🏛️</span> <span>1. Team & Problem Statement</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#CBD5E1] mb-1 font-bold">SIH Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriTech Pioneers"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] mb-1 font-bold">SIH Theme *</label>
                <select
                  value={form.sihTheme}
                  onChange={(e) => setForm({ ...form, sihTheme: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="Agriculture & Rural Development">Agriculture & Rural Development</option>
                  <option value="MedTech & BioTech Healthcare">MedTech & BioTech Healthcare</option>
                  <option value="Clean & Renewable Green Technology">Clean & Green Technology</option>
                  <option value="Smart Automation, IoT & Robotics">Smart Automation & Robotics</option>
                  <option value="Cybersecurity & Disaster Management">Cybersecurity & Disaster</option>
                  <option value="Smart Education & Learning">Smart Education & Learning</option>
                  <option value="Fintech & Web3 Blockchain">Fintech & Web3 Blockchain</option>
                </select>
              </div>
            </div>

            {/* Category Edition Buttons */}
            <div>
              <label className="block text-[#CBD5E1] mb-1.5 font-bold">Category Edition</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, categoryEdition: 'Software Edition' })}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    form.categoryEdition === 'Software Edition'
                      ? 'bg-[#261E0C] border border-[#F59E0B]/70 text-[#FBBF24]'
                      : 'bg-[#070D18] border border-[#334155] text-[#CBD5E1]'
                  }`}
                >
                  &lt;/&gt; Software Edition
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, categoryEdition: 'Hardware Edition' })}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    form.categoryEdition === 'Hardware Edition'
                      ? 'bg-[#261E0C] border border-[#F59E0B]/70 text-[#FBBF24]'
                      : 'bg-[#070D18] border border-[#334155] text-[#CBD5E1]'
                  }`}
                >
                  ⚙ Hardware Edition
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#CBD5E1] mb-1 font-bold">SIH PS Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIH1420"
                  value={form.psCode}
                  onChange={(e) => setForm({ ...form, psCode: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] mb-1 font-bold">Ministry / Organization (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Agriculture"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#CBD5E1] mb-1 font-bold">Problem Statement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI-Powered Crop Disease Detection and Local Marketplace"
                value={form.problemStatementTitle}
                onChange={(e) => setForm({ ...form, problemStatementTitle: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[#CBD5E1] mb-1 font-bold">Detailed Project Pitch & Tech Stack *</label>
              <textarea
                rows="3"
                required
                placeholder="Explain the solution architecture, deliverables, and role responsibilities..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl p-3 text-white outline-none"
              />
            </div>
          </div>

          {/* Section 2: Vacancies to Recruit */}
          <div className="space-y-3 pt-4 border-t border-[#1E293B]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">👥 2. Open Squad Vacancies</span>
              <span className="text-[10px] font-mono text-[#FBBF24] bg-[#261E0C] border border-[#785412] px-2 py-0.5 rounded font-bold">
                {vacancies.length + 1}/6 Members Planned
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRoleInput}
                onChange={(e) => setSelectedRoleInput(e.target.value)}
                className="flex-1 bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2 text-white outline-none cursor-pointer"
              >
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="PPT & Pitch Specialist">PPT & Pitch Specialist</option>
                <option value="IoT & Hardware Engineer">IoT & Hardware Engineer</option>
                <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
              </select>

              <button
                type="button"
                onClick={handleAddVacancy}
                className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all"
              >
                + Add Vacancy
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <div className="bg-[#17130A] border border-[#F59E0B]/50 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-white">👑 {localUser.name || 'You'} (Squad Leader)</span>
                <span className="text-[10px] font-mono text-[#FBBF24] bg-[#261E0C] px-2 py-0.5 rounded font-bold">Filled</span>
              </div>

              {vacancies.map((v, idx) => (
                <div key={idx} className="bg-[#070D18] border border-[#1E293B] p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#CBD5E1]">⚠️ {v.roleName} (1 Vacancy)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVacancy(idx)}
                    className="text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded text-xs cursor-pointer"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Critical Skills */}
          <div className="space-y-3 pt-4 border-t border-[#1E293B]">
            <span className="font-bold text-white text-sm block">⚡ 3. Critical Technical Skills</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PyTorch, React, Canva..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2 text-white outline-none"
              />
              <select
                value={skillPriority}
                onChange={(e) => setSkillPriority(e.target.value)}
                className="bg-[#070D18] border border-[#334155] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="PREFERRED">PREFERRED</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all"
              >
                + Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {criticalSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="bg-[#070D18] border border-[#334155] text-[#CBD5E1] text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <span className={sk.priority === 'CRITICAL' ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                    ● {sk.skillName}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-gray-500 hover:text-rose-400 cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-6 border-t border-[#1E293B] flex items-center justify-end gap-3 sticky bottom-0 bg-[#0B132B] pb-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-[#CBD5E1] font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-8 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Publishing Squad...' : '⚡ Publish Squad & Open Roster'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateTeamModal;

