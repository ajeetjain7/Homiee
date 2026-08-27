import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const SIH_THEMES = [
  'Agriculture & Rural Development',
  'Clean & Renewable Green Technology',
  'Cybersecurity & Disaster Management',
  'Smart Education & Learning',
  'Healthcare & Biomedical Devices',
  'Smart Automation & Robotics',
  'Fintech & Web3 Blockchain',
  'Heritage, Culture & Tourism',
  'Transportation & Logistics',
  'Open Innovation / Miscellaneous'
];

const CreateTeam = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sihTheme: 'Agriculture & Rural Development',
    categoryEdition: 'Software Edition',
    psCode: '',
    problemStatementTitle: '',
    organization: '',
    tagline: '',
    description: '',
    vacancies: [
      { roleName: 'Backend Developer', count: 1, status: 'Vacant' },
      { roleName: 'PPT & Pitch Designer', count: 1, status: 'Vacant' }
    ],
    criticalSkills: [
      { skillName: 'React', priority: 'CRITICAL' },
      { skillName: 'PPT Making', priority: 'CRITICAL' }
    ]
  });

  const [newVacancyRole, setNewVacancyRole] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddVacancy = () => {
    if (!newVacancyRole.trim()) return;
    setFormData({
      ...formData,
      vacancies: [...formData.vacancies, { roleName: newVacancyRole.trim(), count: 1, status: 'Vacant' }]
    });
    setNewVacancyRole('');
  };

  const handleRemoveVacancy = (idx) => {
    setFormData({
      ...formData,
      vacancies: formData.vacancies.filter((_, i) => i !== idx)
    });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setFormData({
      ...formData,
      criticalSkills: [...formData.criticalSkills, { skillName: newSkillName.trim(), priority: 'CRITICAL' }]
    });
    setNewSkillName('');
  };

  const handleRemoveSkill = (idx) => {
    setFormData({
      ...formData,
      criticalSkills: formData.criticalSkills.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.psCode || !formData.problemStatementTitle || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        tagline: formData.tagline || formData.problemStatementTitle
      };

      await api.post('/api/teams/create', payload);

      toast.success(`🎉 Squad "${formData.name}" created successfully!`);
      navigate('/team');
    } catch (err) {
      console.error('Create Team Error:', err);
      toast.error(err.response?.data?.message || 'Failed to create squad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-white select-none pb-12">
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
          SIH 2026 OFFICIAL REGISTRATION
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight">Create SIH 2026 Squad</h1>
        <p className="text-xs text-[#CBD5E1]">Publish your team requirements and open roles for student innovators.</p>
      </div>

      <div className="bg-[#0B132B] border border-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-bold mb-1">Squad / Team Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AgroAI Champions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">Official SIH Theme *</label>
              <select
                value={formData.sihTheme}
                onChange={(e) => setFormData({ ...formData, sihTheme: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
              >
                {SIH_THEMES.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-bold mb-1">SIH Problem Statement Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SIH1420"
                value={formData.psCode}
                onChange={(e) => setFormData({ ...formData, psCode: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">Category Edition</label>
              <select
                value={formData.categoryEdition}
                onChange={(e) => setFormData({ ...formData, categoryEdition: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Software Edition">Software Edition</option>
                <option value="Hardware Edition">Hardware Edition</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">Ministry / Organization</label>
              <input
                type="text"
                placeholder="e.g. Ministry of Agriculture"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Problem Statement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI-driven Pest Detection and Real-time Crop Advisory"
              value={formData.problemStatementTitle}
              onChange={(e) => setFormData({ ...formData, problemStatementTitle: e.target.value })}
              className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Squad Description & Approach *</label>
            <textarea
              rows="3"
              required
              placeholder="Explain your approach, architecture, and team strategy..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#070D18] border border-[#334155] focus:border-amber-400 rounded-xl p-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5 flex items-center justify-between">
              <span>Required Role Vacancies</span>
              <span className="text-[10px] text-gray-400 font-mono">Max 6 Total Members</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Backend Dev, PPT Specialist, UI/UX"
                value={newVacancyRole}
                onChange={(e) => setNewVacancyRole(e.target.value)}
                className="flex-1 bg-[#070D18] border border-[#334155] rounded-xl px-3.5 py-2 text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddVacancy}
                className="bg-amber-500 text-black font-black px-4 py-2 rounded-xl cursor-pointer"
              >
                + Add Vacancy
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.vacancies.map((v, idx) => (
                <span
                  key={idx}
                  className="bg-[#17130A] border border-[#F59E0B]/60 text-[#FBBF24] text-xs font-mono px-3 py-1 rounded-xl flex items-center gap-2"
                >
                  <span>⚠️ {v.roleName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVacancy(idx)}
                    className="text-gray-400 hover:text-rose-400 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Critical Tech Skills Needed</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. React, PyTorch, Canva, Docker"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 bg-[#070D18] border border-[#334155] rounded-xl px-3.5 py-2 text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-[#0F172A] border border-[#334155] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#1E293B] cursor-pointer"
              >
                + Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.criticalSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="bg-[#070D18] border border-[#334155] text-[#CBD5E1] text-xs font-mono px-3 py-1 rounded-xl flex items-center gap-2"
                >
                  <span>⚡ {s.skillName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-gray-400 hover:text-rose-400 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs py-3.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Publishing Squad...' : '⚡ Publish Squad & Open Vacancies'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateTeam;