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

const INITIAL_VACANCIES = [
  { roleName: 'Backend Developer', count: 1, status: 'Vacant' },
  { roleName: 'AI / ML Engineer', count: 1, status: 'Vacant' },
  { roleName: 'PPT & Pitch Deck Designer', count: 1, status: 'Vacant' }
];

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
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
    vacancies: INITIAL_VACANCIES,
    criticalSkills: [
      { skillName: 'React', priority: 'CRITICAL' },
      { skillName: 'PPT Making', priority: 'CRITICAL' }
    ]
  });

  const [newVacancyRole, setNewVacancyRole] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        tagline: formData.tagline || formData.problemStatementTitle
      };

      const res = await api.post('/api/teams/create', payload);

      toast.success(`🎉 Squad "${formData.name}" created successfully!`);
      onClose();
      if (onSuccess) onSuccess(res.data);
      navigate('/team');
    } catch (err) {
      console.error('Create Team Error:', err);
      toast.error(err.response?.data?.message || 'Failed to create squad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto select-none font-sans">
      <div className="bg-[#0B132B] border border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1E293B] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-lg flex items-center justify-center">
                ⚡
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">Create SIH 2026 Squad</h2>
            </div>
            <p className="text-xs text-[#CBD5E1]">
              Publish your problem statement requirements and open vacancies for students to apply.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Row 1: Squad Name & Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1">Squad / Team Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AgroAI Champions, ByteBuilders"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1">SIH Official Theme *</label>
              <select
                value={formData.sihTheme}
                onChange={(e) => setFormData({ ...formData, sihTheme: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
              >
                {SIH_THEMES.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: PS Code & Category Edition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1">SIH PS Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SIH1420, SIH128"
                value={formData.psCode}
                onChange={(e) => setFormData({ ...formData, psCode: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1">Category Edition</label>
              <select
                value={formData.categoryEdition}
                onChange={(e) => setFormData({ ...formData, categoryEdition: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Software Edition">Software Edition</option>
                <option value="Hardware Edition">Hardware Edition</option>
              </select>
            </div>

            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1">Ministry / Organization</label>
              <input
                type="text"
                placeholder="e.g. Ministry of Agriculture"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
              />
            </div>
          </div>

          {/* Problem Statement Title */}
          <div>
            <label className="block text-[#CBD5E1] font-bold mb-1">Problem Statement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI-driven Pest Detection and Real-time Crop Advisory"
              value={formData.problemStatementTitle}
              onChange={(e) => setFormData({ ...formData, problemStatementTitle: e.target.value })}
              className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-white outline-none"
            />
          </div>

          {/* Squad Pitch / Description */}
          <div>
            <label className="block text-[#CBD5E1] font-bold mb-1">Squad Description & Approach *</label>
            <textarea
              rows="3"
              required
              placeholder="Explain your approach, architecture, and what makes your squad's approach unique for SIH 2026..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl p-3 text-white outline-none leading-relaxed"
            />
          </div>

          {/* Vacancy Roles Needed */}
          <div>
            <label className="block text-[#CBD5E1] font-bold mb-1.5 flex items-center justify-between">
              <span>Required Role Vacancies (Looking For)</span>
              <span className="text-[10px] text-[#94A3B8] font-mono">Max 6 Total Members</span>
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
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
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
                    className="text-[#94A3B8] hover:text-rose-400 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Critical Skills */}
          <div>
            <label className="block text-[#CBD5E1] font-bold mb-1.5">Critical Tech Skills Needed</label>
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
                className="bg-[#0F172A] border border-[#334155] text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#1E293B] cursor-pointer"
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
                    className="text-[#94A3B8] hover:text-rose-400 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#070D18] hover:bg-[#0B132B] border border-[#334155] text-[#CBD5E1] font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Publishing Squad...' : '⚡ Form Squad & Open Vacancies'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateTeamModal;
