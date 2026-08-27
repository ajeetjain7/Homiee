import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DEFAULT_CANDIDATES = [
  {
    _id: 'seed_1',
    name: 'Vikramaditya Rathore',
    gender: 'Male',
    college: 'IET DAVV, Indore',
    classBranch: 'B.Tech Computer Science & Eng.',
    section: 'Section B',
    year: '3rd Year',
    yearAndBranch: '3rd Year • B.Tech CSE (Section B)',
    primaryRole: 'Fullstack Developer',
    capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX', 'Backend & APIs'],
    technicalSkills: ['React', 'Node.js', 'MongoDB', 'PPT Making', 'Canva', 'TailwindCSS'],
    sihThemes: ['Agriculture & Rural Development', 'Smart Education & Learning'],
    about: 'Passionate fullstack engineer & pitch presentation designer. 3 hackathons won, looking for enthusiastic teammates for SIH 2026.',
    github: 'https://github.com/vikram-rathore',
    linkedin: 'https://linkedin.com/in/vikram-rathore',
    portfolio: 'https://vikramaditya.dev',
    leetcodeRating: '1920 (Knight)',
    sihReadinessScore: 92
  },
  {
    _id: 'seed_2',
    name: 'Divya Nambiar',
    gender: 'Female',
    college: 'NIT, Trichy',
    classBranch: 'B.Tech AI & Data Science',
    section: 'Section A',
    year: '3rd Year',
    yearAndBranch: '3rd Year • AI & Data Sci. (Section A)',
    primaryRole: 'AI / ML Engineer',
    capabilities: ['AI / ML & Deep Learning', 'Research & Documentation', 'PPT Making & Pitch Deck'],
    technicalSkills: ['Python', 'PyTorch', 'Computer Vision', 'YOLOv8', 'FastAPI', 'Canva'],
    sihThemes: ['Healthcare & Biomedical Devices', 'Clean & Renewable Green Technology'],
    about: 'Specialized in Computer Vision & real-time edge AI inference. SIH finalist in 2024. Expert in converting technical architectures into clean PPT pitch decks.',
    github: 'https://github.com/divya-ml',
    linkedin: 'https://linkedin.com/in/divya-nambiar',
    portfolio: 'https://divyanambiar.ai',
    leetcodeRating: '1750',
    sihReadinessScore: 88
  },
  {
    _id: 'seed_3',
    name: 'Sneha Reddy',
    gender: 'Female',
    college: 'SRM Inst. of Science & Tech',
    classBranch: 'B.Tech Cybersecurity',
    section: 'Section C',
    year: '2nd Year',
    yearAndBranch: '2nd Year • Cybersecurity (Section C)',
    primaryRole: 'Cybersecurity Specialist',
    capabilities: ['Cybersecurity & Auditing', 'Backend & APIs', 'Research & Documentation'],
    technicalSkills: ['Linux', 'Cryptography', 'Smart Contracts', 'Solidity', 'Go', 'Docker'],
    sihThemes: ['Cybersecurity & Disaster Management', 'Fintech & Web3 Blockchain'],
    about: 'CTF player and smart contract security researcher. Ready to build bulletproof backend systems for SIH 2026 themes.',
    github: 'https://github.com/sneha-sec',
    linkedin: 'https://linkedin.com/in/sneha-reddy',
    portfolio: '',
    leetcodeRating: '1680',
    sihReadinessScore: 84
  },
  {
    _id: 'seed_4',
    name: 'Rohan Gupta',
    gender: 'Male',
    college: 'BITS Pilani',
    classBranch: 'B.E. Computer Science',
    section: 'Section A',
    year: '2nd Year',
    yearAndBranch: '2nd Year • CSE (Section A)',
    primaryRole: 'PPT & Presentation Specialist',
    capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX', 'Research & Documentation'],
    technicalSkills: ['PPT Making', 'Canva', 'Figma', 'Pitch Deck Design', 'HTML5/CSS3', 'React'],
    sihThemes: ['Smart Education & Learning', 'Heritage, Culture & Tourism'],
    about: 'Master at designing winning SIH PPT presentations, product pitch videos, and UI prototypes. Ensures our team presentation scores 10/10 with judges.',
    github: 'https://github.com/rohan-design',
    linkedin: 'https://linkedin.com/in/rohan-gupta',
    portfolio: 'https://rohandesign.com',
    leetcodeRating: 'N/A',
    sihReadinessScore: 86
  },
  {
    _id: 'seed_5',
    name: 'Aditya Verma',
    gender: 'Male',
    college: 'Manipal Inst. of Technology',
    classBranch: 'B.Tech IT',
    section: 'Section B',
    year: '4th Year',
    yearAndBranch: '4th Year • IT (Section B)',
    primaryRole: 'Backend Developer',
    capabilities: ['Backend & APIs', 'System Architecture', 'Database Management'],
    technicalSkills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    sihThemes: ['Transportation & Logistics', 'Fintech & Web3 Blockchain'],
    about: 'High-scale backend architect. Built microservices serving 50k+ requests. Looking for AI and frontend innovators to tackle SIH logistics statements.',
    github: 'https://github.com/aditya-verma',
    linkedin: 'https://linkedin.com/in/aditya-verma',
    portfolio: 'https://adityaverma.dev',
    leetcodeRating: '2040 (Guardian)',
    sihReadinessScore: 94
  },
  {
    _id: 'seed_6',
    name: 'Vikram Aditya',
    gender: 'Male',
    college: 'IIIT Hyderabad',
    classBranch: 'B.Tech ECE',
    section: 'Section A',
    year: '3rd Year',
    yearAndBranch: '3rd Year • ECE (Section A)',
    primaryRole: 'IoT & Embedded Engineer',
    capabilities: ['Hardware & IoT', 'Backend & APIs', 'PPT Making & Pitch Deck'],
    technicalSkills: ['Arduino', 'ESP32', 'MQTT Protocol', 'C++', 'Circuit Design', 'Canva'],
    sihThemes: ['Agriculture & Rural Development', 'Smart Automation & Robotics'],
    about: 'Hardware tinkerer with 6 IoT sensors & robotics projects. Experienced in hardware edition SIH problem statements.',
    github: 'https://github.com/vikram-iot',
    linkedin: 'https://linkedin.com/in/vikram-aditya',
    portfolio: '',
    leetcodeRating: '1620',
    sihReadinessScore: 82
  }
];

const TECH_STACK_OPTIONS = [
  'Frontend', 'Backend', 'AI/ML', 'IoT', 'UI/UX', 'Cloud/DevOps', 
  'PPT Making', 'React', 'Node.js', 'Python', 'Docker', 'PyTorch', 'MongoDB', 'Flutter'
];

const COMMON_PS_CODES = [
  'All PS Codes', 'SIH1420', 'SIH1425', 'SIH1430', 'SIH1442', 'SIH1450', 'SIH1462', 'SIH1480', 'SIH1495', 'SIH1510'
];

const FindTeammates = ({ currentUser }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Technical Roles');
  const [selectedCapability, setSelectedCapability] = useState('All Capabilities');
  const [selectedTheme, setSelectedTheme] = useState('All Interested SIH Themes');
  const [selectedYear, setSelectedYear] = useState('All Academic Years');
  const [selectedGender, setSelectedGender] = useState('All Genders');
  const [selectedPsCode, setSelectedPsCode] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const localUser = currentUser || (() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const toggleSkillFilter = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const fetchTeammates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: skillSearch,
        role: selectedRole,
        capability: selectedCapability,
        theme: selectedTheme,
        year: selectedYear,
        gender: selectedGender,
        skills: selectedSkills.join(','),
        psCode: selectedPsCode === 'All PS Codes' ? '' : selectedPsCode
      });

      const res = await axios.get(`http://localhost:5000/api/auth/teammates?${queryParams.toString()}`);
      let fetchedList = res.data;

      if (!fetchedList || fetchedList.length === 0) {
        fetchedList = DEFAULT_CANDIDATES;
      }

      // Merge current user if complete
      if (localUser && (localUser.isProfileComplete || localUser.profileComplete)) {
        const alreadyInList = fetchedList.some(u => u._id === localUser._id || u.email === localUser.email);
        if (!alreadyInList) {
          fetchedList = [localUser, ...fetchedList];
        }
      }

      // Client-side fallback filter if offline/demo
      const filtered = fetchedList.filter((c) => {
        const matchSearch = !skillSearch.trim() || 
          c.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
          (c.classBranch && c.classBranch.toLowerCase().includes(skillSearch.toLowerCase())) ||
          (c.college && c.college.toLowerCase().includes(skillSearch.toLowerCase())) ||
          (c.about && c.about.toLowerCase().includes(skillSearch.toLowerCase())) ||
          (c.technicalSkills && c.technicalSkills.some(s => s.toLowerCase().includes(skillSearch.toLowerCase()))) ||
          (c.capabilities && c.capabilities.some(cap => cap.toLowerCase().includes(skillSearch.toLowerCase())));

        const matchGender = selectedGender === 'All Genders' || selectedGender === 'All' || c.gender === selectedGender;
        const matchRole = selectedRole === 'All Technical Roles' || selectedRole === 'All Roles' || c.primaryRole === selectedRole;
        const matchCap = selectedCapability === 'All Capabilities' || (c.capabilities && c.capabilities.includes(selectedCapability));
        const matchTheme = selectedTheme === 'All Interested SIH Themes' || selectedTheme === 'All Themes' || (c.sihThemes && c.sihThemes.includes(selectedTheme));
        const matchYear = selectedYear === 'All Academic Years' || selectedYear === 'All' || c.year === selectedYear;
        const matchPs = !selectedPsCode || selectedPsCode === 'All PS Codes' || (c.about && c.about.toLowerCase().includes(selectedPsCode.toLowerCase()));
        
        const matchSkills = selectedSkills.length === 0 || selectedSkills.every(sk => 
          (c.technicalSkills && c.technicalSkills.some(ts => ts.toLowerCase().includes(sk.toLowerCase()))) ||
          (c.capabilities && c.capabilities.some(cap => cap.toLowerCase().includes(sk.toLowerCase())))
        );

        return matchSearch && matchGender && matchRole && matchCap && matchTheme && matchYear && matchPs && matchSkills;
      });

      setCandidates(filtered);
    } catch (err) {
      console.warn('Backend unavailable, using local teammate pool:', err);
      let list = DEFAULT_CANDIDATES;
      if (localUser && (localUser.isProfileComplete || localUser.profileComplete)) {
        list = [localUser, ...DEFAULT_CANDIDATES.filter(c => c.email !== localUser.email)];
      }
      setCandidates(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeammates, 300);
    return () => clearTimeout(timer);
  }, [skillSearch, selectedRole, selectedCapability, selectedTheme, selectedYear, selectedGender, selectedPsCode, selectedSkills, localUser?.profileComplete, localUser?.isProfileComplete]);

  const handleInvite = (candidateName) => {
    toast.success(`🎉 Squad recruitment invite sent to ${candidateName}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#F8FAFC] select-none">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
            ⚡ SIH 2026 TEAMMATE DISCOVERY • {candidates.length} STUDENT INNOVATORS
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Find SIH Teammates</h1>
          <p className="text-xs text-[#CBD5E1]">Discover students by SIH PS code, gender diversity, tech stacks, PPT strengths, and credentials.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/form-team'} 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#000000] font-black text-xs px-5 py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
          >
            ⚡ Form Squad & Recruit
          </button>
        </div>
      </div>

      {/* User's Own Live Card Status Banner */}
      {localUser && (localUser.isProfileComplete || localUser.profileComplete) && (
        <div className="bg-[#0E201B] border border-[#059669]/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34D399] text-[#000000] font-black flex items-center justify-center text-sm shadow-md">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#34D399] font-mono">YOUR TEAMMATE CARD IS LIVE IN SIH DIRECTORY</span>
                <span className="bg-[#0E3A2F] text-[#34D399] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#059669]/40">
                  {localUser.sihReadinessScore || 85}% READINESS
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] mt-0.5">
                Squad leaders discover you as <span className="text-white font-black">{localUser.name}</span> ({localUser.primaryRole || 'Fullstack Developer'}) from {localUser.college || 'your institute'}.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-[#070D18] hover:bg-[#0B132B] border border-[#334155] text-xs text-[#F8FAFC] font-mono font-bold px-4 py-2 rounded-xl cursor-pointer transition-all"
          >
            ✏️ Edit Card Info
          </button>
        </div>
      )}

      {/* Search & Filter Controls Matrix */}
      <div className="bg-[#0B132B] border border-[#1E293B] p-5 rounded-2xl space-y-4 shadow-2xl">
        
        {/* Row 1: Primary Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <input
            type="text"
            placeholder="🔍 Search name, college, skill..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#94A3B8]"
          />

          {/* Filter 1: SIH PS Code (Input or Dropdown) */}
          <input
            type="text"
            placeholder="🎯 PS Code (e.g. SIH1420)..."
            value={selectedPsCode}
            onChange={(e) => setSelectedPsCode(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#94A3B8]"
          />

          {/* Filter 2: Gender Filter (Male / Female / Other / All) */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Genders">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female (SIH Diversity)</option>
            <option value="Other">Other</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Technical Roles">All Roles</option>
            <option value="Fullstack Developer">⚡ Fullstack Developer</option>
            <option value="Frontend Developer">💻 Frontend Developer</option>
            <option value="Backend Developer">⚙️ Backend Developer</option>
            <option value="PPT & Presentation Specialist">📊 PPT Specialist</option>
            <option value="AI / ML Engineer">🤖 AI / ML Engineer</option>
            <option value="UI / UX Designer">🎨 UI / UX Designer</option>
            <option value="Cybersecurity Specialist">🛡️ Cybersecurity</option>
            <option value="IoT & Hardware Engineer">🔌 IoT & Hardware</option>
          </select>

          {/* Academic Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="All Academic Years">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        {/* Row 2: Multi-Select Tech Stack / Skill Filters */}
        <div className="pt-2 border-t border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#E2E8F0] font-bold uppercase flex items-center gap-1.5">
              <span>⚡</span> Filter by Tech Stack & Skills (Multi-Select):
            </span>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Clear Skills ({selectedSkills.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TECH_STACK_OPTIONS.map((skill) => {
              const active = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkillFilter(skill)}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer font-mono font-medium flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold shadow-md shadow-amber-500/20'
                      : 'bg-[#070D18] border-[#334155] text-[#CBD5E1] hover:border-[#64748B] hover:text-white'
                  }`}
                >
                  <span>{active ? '✓' : '+'}</span>
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Teammates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((c, idx) => {
          const isUserCard = localUser && (localUser._id === c._id || localUser.email === c.email);
          const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'IN';

          return (
            <div
              key={c._id || idx}
              className={`bg-[#0B132B] border rounded-2xl p-6 relative flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl transition-all hover:border-[#475569] ${
                isUserCard ? 'border-amber-500 shadow-amber-500/10 ring-1 ring-amber-500/30' : 'border-[#1E293B]'
              }`}
            >
              {/* Top Tag Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#261E0C] border border-[#785412] text-[#FBBF24] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded">
                    {c.primaryRole || 'Fullstack Developer'}
                  </span>
                  {c.gender && (
                    <span className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-[10px] font-mono px-2 py-0.5 rounded">
                      {c.gender}
                    </span>
                  )}
                </div>

                {isUserCard ? (
                  <span className="bg-[#0E3A2F] border border-[#059669]/60 text-[#34D399] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                    YOU
                  </span>
                ) : (
                  <span className="bg-[#0C2A4A] border border-[#0284C7]/50 text-[#38BDF8] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {c.sihReadinessScore || 85}% READINESS
                  </span>
                )}
              </div>

              {/* Teammate Header Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-base shadow-md">
                  {initials}
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-white text-base tracking-tight leading-snug">{c.name}</h3>
                  <p className="text-xs text-[#E2E8F0] font-medium">
                    🎓 {c.college || 'College / Institute'}
                  </p>
                  <p className="text-[11px] font-mono text-[#CBD5E1]">
                    {c.year || '3rd Year'} • {c.classBranch || 'Computer Science'} {c.section ? `(${c.section})` : ''}
                  </p>
                </div>
              </div>

              {/* Capabilities & Strengths (PPT, Backend, Frontend) */}
              {c.capabilities && c.capabilities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#94A3B8] block uppercase font-bold">CORE CAPABILITIES</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          cap.includes('PPT')
                            ? 'bg-[#261E0C] border-[#F59E0B]/70 text-[#FBBF24] font-bold'
                            : 'bg-[#070D18] border-[#334155] text-[#E2E8F0]'
                        }`}
                      >
                        {cap.includes('PPT') ? '📊 ' : '⚡ '}
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About / Pitch Note */}
              {c.about && (
                <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl text-xs text-[#E2E8F0] leading-relaxed">
                  <span className="text-[10px] font-mono text-[#F59E0B] font-bold block mb-1">💬 ABOUT / PITCH</span>
                  <p className="line-clamp-2">{c.about}</p>
                </div>
              )}

              {/* Technical Skills Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#94A3B8] block uppercase font-bold">VERIFIED SKILLS</span>
                <div className="flex flex-wrap gap-1.5">
                  {(c.technicalSkills || ['React', 'Node.js', 'PPT Making']).map((s, i) => (
                    <span key={i} className="bg-[#070D18] border border-[#334155] text-[#E2E8F0] text-[10px] font-mono px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* External Credentials & CP Ratings */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#1E293B] text-xs font-mono">
                {c.github && (
                  <a href={c.github} target="_blank" rel="noreferrer" className="text-[#CBD5E1] hover:text-white transition-colors" title="GitHub">
                    🐙 GitHub
                  </a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline" title="LinkedIn">
                    💼 LinkedIn
                  </a>
                )}
                {c.leetcodeRating && c.leetcodeRating !== 'N/A' && (
                  <span className="text-amber-400 font-bold" title="LeetCode Rating">
                    🏆 {c.leetcodeRating}
                  </span>
                )}
              </div>

              {/* Action Button */}
              {isUserCard ? (
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="w-full bg-[#17130A] border border-[#F59E0B]/70 hover:border-[#F59E0B] text-[#FBBF24] font-mono font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  ⚙️ Manage Your Teammate Card
                </button>
              ) : (
                <button
                  onClick={() => handleInvite(c.name)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#000000] font-black text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
                >
                  ⚡ Invite to Squad
                </button>
              )}
            </div>
          );
        })}
      </div>

      {candidates.length === 0 && !loading && (
        <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl p-12 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-white">No teammates matched your filters</h3>
          <p className="text-xs text-[#CBD5E1]">Try adjusting your PS code, gender, skills, or role filters.</p>
          <button
            onClick={() => {
              setSkillSearch('');
              setSelectedRole('All Technical Roles');
              setSelectedCapability('All Capabilities');
              setSelectedTheme('All Interested SIH Themes');
              setSelectedYear('All Academic Years');
              setSelectedGender('All Genders');
              setSelectedPsCode('');
              setSelectedSkills([]);
            }}
            className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-xs font-mono px-4 py-2 rounded-xl text-white cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default FindTeammates;