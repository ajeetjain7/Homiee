import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const POPULAR_CAPABILITIES = [
  'PPT Making & Pitch Deck',
  'Frontend UI / UX',
  'Backend & APIs',
  'Fullstack Engineering',
  'AI / ML & Deep Learning',
  'System Architecture',
  'Database Management',
  'Research & Documentation',
  'Hardware & IoT',
  'Cybersecurity & Auditing'
];

const PRESET_SKILLS = [
  'PPT Making', 'Canva', 'Pitching', 'React', 'Node.js', 'Python', 'TailwindCSS', 
  'MongoDB', 'Express', 'Figma', 'PyTorch', 'TensorFlow', 'PostgreSQL', 'Docker', 
  'C++', 'Java', 'Next.js', 'Git', 'FastAPI', 'Flutter', 'AWS'
];

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

const OnboardingModal = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college: user?.college || '',
    classBranch: user?.classBranch || '',
    section: user?.section || 'Section A',
    year: user?.year || '3rd Year',
    gender: user?.gender || 'Male',
    primaryRole: user?.primaryRole || 'Fullstack Developer',
    capabilities: user?.capabilities && user.capabilities.length > 0 ? user.capabilities : ['PPT Making & Pitch Deck', 'Frontend UI / UX'],
    technicalSkills: user?.technicalSkills && user.technicalSkills.length > 0 ? user.technicalSkills : ['React', 'PPT Making', 'Node.js'],
    sihThemes: user?.sihThemes && user.sihThemes.length > 0 ? user.sihThemes : ['Agriculture & Rural Development'],
    about: user?.about || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    portfolio: user?.portfolio || '',
    leetcodeRating: user?.leetcodeRating || ''
  });

  const [customSkill, setCustomSkill] = useState('');

  const toggleCapability = (cap) => {
    setFormData(prev => {
      const exists = prev.capabilities.includes(cap);
      const updated = exists ? prev.capabilities.filter(c => c !== cap) : [...prev.capabilities, cap];
      return { ...prev, capabilities: updated };
    });
  };

  const toggleTheme = (theme) => {
    setFormData(prev => {
      const exists = prev.sihThemes.includes(theme);
      const updated = exists ? prev.sihThemes.filter(t => t !== theme) : [...prev.sihThemes, theme];
      return { ...prev, sihThemes: updated };
    });
  };

  const addSkill = (skillToAdd) => {
    const s = skillToAdd.trim();
    if (!s) return;
    if (!formData.technicalSkills.includes(s)) {
      setFormData(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, s] }));
    }
    setCustomSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      userId: user?._id || 'user_' + Date.now(),
      ...formData,
      profileComplete: true,
      isProfileComplete: true,
      yearAndBranch: `${formData.year} • ${formData.classBranch}${formData.section ? ` (${formData.section})` : ''}`
    };

    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', payload);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      toast.success('🎉 Preferences saved! Your teammate card is now live!');
      if (onComplete) onComplete(res.data);
    } catch (err) {
      console.warn('Backend offline or error, saving profile locally:', err);
      const localUser = { ...user, ...payload };
      localStorage.setItem('userInfo', JSON.stringify(localUser));
      toast.success('🎉 Preferences saved! Welcome to SIH Teammate Discovery!');
      if (onComplete) onComplete(localUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0B132B] border border-amber-500/40 rounded-2xl max-w-3xl w-full shadow-2xl shadow-amber-500/10 relative my-8 overflow-hidden text-white font-sans">
        
        {/* Top Glowing Header Bar */}
        <div className="bg-[#050A14] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-black font-extrabold flex items-center justify-center text-base shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Complete Your Innovator Profile</h2>
              <p className="text-[11px] font-mono text-gray-400">Unlock SIH Squad Discovery, Join Requests & Your Live Teammate Card</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#261E0C] border border-[#785412] text-[#FBBF24] px-3 py-1 rounded-full uppercase">
            Step {step} of 3
          </span>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 bg-[#070D18] border-b border-gray-800 text-[11px] font-mono font-bold">
          <button 
            type="button"
            onClick={() => setStep(1)} 
            className={`py-2.5 px-4 text-center border-r border-gray-800 transition-colors ${step === 1 ? 'text-[#F59E0B] bg-amber-500/10' : 'text-gray-400 hover:text-white'}`}
          >
            1. Academics & Identity
          </button>
          <button 
            type="button"
            onClick={() => setStep(2)} 
            className={`py-2.5 px-4 text-center border-r border-gray-800 transition-colors ${step === 2 ? 'text-[#F59E0B] bg-amber-500/10' : 'text-gray-400 hover:text-white'}`}
          >
            2. Role & PPT / Tech Skills
          </button>
          <button 
            type="button"
            onClick={() => setStep(3)} 
            className={`py-2.5 px-4 text-center transition-colors ${step === 3 ? 'text-[#F59E0B] bg-amber-500/10' : 'text-gray-400 hover:text-white'}`}
          >
            3. About & Credentials
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

          {/* STEP 1: Academic & Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                📌 Enter your college, branch, section, and year so teammates from your institute and across India can discover and invite you to squads.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shivam Purohit"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">College / Institute *</label>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. IET DAVV / NIT Trichy / IIT Delhi"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Class / Degree & Branch *</label>
                  <input
                    type="text"
                    required
                    value={formData.classBranch}
                    onChange={(e) => setFormData({ ...formData, classBranch: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science / MCA / IT / ECE"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Section / Division *</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. Section A, Section B, CS-2"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Academic Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female (Mandatory SIH Diversity Criteria)</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Role, PPT & Technical Capabilities */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">Primary Technical Role *</label>
                <select
                  value={formData.primaryRole}
                  onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                  className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                >
                  <option value="Fullstack Developer">⚡ Fullstack Developer</option>
                  <option value="Frontend Developer">💻 Frontend Developer (React/Vue/Web)</option>
                  <option value="Backend Developer">⚙️ Backend Developer (Node/Django/Go)</option>
                  <option value="PPT & Presentation Specialist">📊 PPT & Pitch Deck Specialist</option>
                  <option value="AI / ML Engineer">🤖 AI / ML Engineer (PyTorch/Vision/NLP)</option>
                  <option value="UI / UX Designer">🎨 UI / UX Designer (Figma/Product Design)</option>
                  <option value="DevOps & Cloud Engineer">☁️ DevOps & Cloud Engineer (Docker/AWS)</option>
                  <option value="IoT & Embedded Engineer">🔌 IoT & Hardware Engineer (Arduino/Sensors)</option>
                  <option value="Cybersecurity Specialist">🛡️ Cybersecurity Specialist</option>
                  <option value="Mobile App Developer">📱 Mobile App Developer (Flutter/React Native)</option>
                </select>
              </div>

              {/* Capabilities Multi-Select Chips */}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1 font-bold uppercase">
                  Your Squad Capabilities (Select all that apply) *
                </label>
                <p className="text-[11px] text-gray-500 mb-2">Showcase whether you excel at PPT creation, pitch deck delivery, frontend, backend, or AI modeling.</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CAPABILITIES.map((cap) => {
                    const selected = formData.capabilities.includes(cap);
                    return (
                      <button
                        type="button"
                        key={cap}
                        onClick={() => toggleCapability(cap)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-mono font-medium flex items-center gap-1.5 ${
                          selected
                            ? 'bg-[#261E0C] border-[#F59E0B] text-[#FBBF24] shadow-sm'
                            : 'bg-[#070D18] border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <span>{selected ? '✓' : '+'}</span>
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Skills Tag Manager */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 mb-1 font-bold uppercase">
                  Technical & Design Skills (Add your stack)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(customSkill);
                      }
                    }}
                    placeholder="Type skill & press Enter (e.g. PPT Making, Figma, React)..."
                    className="flex-1 bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(customSkill)}
                    className="bg-[#F59E0B] hover:bg-[#E08D00] text-black font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Selected Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.technicalSkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-[#0E3A2F] border border-[#059669]/40 text-[#34D399] text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-gray-400 hover:text-rose-400 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Quick Add Suggestions */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-gray-500 block mb-1">QUICK SUGGESTIONS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SKILLS.slice(0, 12).map((ps) => (
                      <button
                        type="button"
                        key={ps}
                        onClick={() => addSkill(ps)}
                        className="bg-[#070D18] hover:bg-gray-800 text-[10px] text-gray-400 font-mono px-2 py-0.5 rounded border border-gray-800 cursor-pointer"
                      >
                        +{ps}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: About, SIH Themes & Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5 font-bold uppercase">
                  About You & Teammate Pitch *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Introduce yourself! E.g. Passionate developer and pitch deck creator with 3 hackathons experience. Expert in fullstack and PPT presentations..."
                  className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              {/* Interested SIH Themes */}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1 font-bold uppercase">
                  Interested SIH Problem Statement Themes
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {SIH_THEMES.map((theme) => {
                    const active = formData.sihThemes.includes(theme);
                    return (
                      <button
                        type="button"
                        key={theme}
                        onClick={() => toggleTheme(theme)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#261E0C] border-[#785412] text-[#FBBF24]'
                            : 'bg-[#070D18] border-gray-800 text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Credentials & External Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">Portfolio / Project Demo Link</label>
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    placeholder="https://portfolio.dev"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1 font-bold">LeetCode / CP Rating</label>
                  <input
                    type="text"
                    value={formData.leetcodeRating}
                    onChange={(e) => setFormData({ ...formData, leetcodeRating: e.target.value })}
                    placeholder="e.g. 1850 / Knight / 5-Star"
                    className="w-full bg-[#070D18] border border-gray-700 focus:border-[#F59E0B] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Bottom Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                ← Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!formData.name || !formData.college || !formData.classBranch)) {
                    toast.error('Please fill in required academic details.');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="bg-[#F59E0B] hover:bg-[#E08D00] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Continue Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-8 py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Saving Preferences...' : '⚡ Save Preferences & Finish'}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};

export default OnboardingModal;

