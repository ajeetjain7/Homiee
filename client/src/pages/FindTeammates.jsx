import React, { useState } from 'react';
import toast from 'react-hot-toast';

const FindTeammates = () => {
  const [skillSearch, setSkillInput] = useState('');

  const candidates = [
    { name: 'Vikramaditya Rathore', role: 'Fullstack Developer', college: 'College / Institute • 3rd Year, CSE', match: 'GREAT MATCH', skills: ['React', 'Node.js', 'MongoDB'] },
    { name: 'Divya Nambiar', role: 'AI / ML Engineer', college: 'NIT, Trichy • 3rd Yr, AI & Data Sci.', match: 'GREAT MATCH', skills: ['Python', 'Computer Vision', 'PyTorch'] },
    { name: 'Sneha Reddy', role: 'Cybersecurity Specialist', college: 'SRM Inst. of Sci. & Tech • 2nd Yr', match: 'GREAT MATCH', skills: ['Linux', 'Cryptography', 'Smart Contracts'] },
    { name: 'Aditya Verma', role: 'AI / ML Engineer', college: 'Manipal Inst. of Tech • 4th Yr', match: 'GREAT MATCH', skills: ['Data Analysis', 'TensorFlow', 'Python'] },
    { name: 'Vikram Aditya', role: 'IoT & Hardware Engineer', college: 'IIIT • 3rd Yr, ECE', match: 'GREAT MATCH', skills: ['Arduino', 'MQTT Protocol', 'Circuit Design'] },
    { name: 'Rohan Gupta', role: 'UI/UX Designer', college: 'BITS Pilani • 2nd Yr', match: 'GREAT MATCH', skills: ['Design Systems', 'HTML5/CSS3', 'Wireframing'] }
  ];

  const handleInvite = (candidateName) => {
    toast.success(`Squad recruitment invitation sent to ${candidateName}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">SIH TEAMMATE DISCOVERY • 9 STUDENT INNOVATORS AVAILABLE</span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Find SIH Teammates</h1>
        </div>
        <button onClick={() => window.location.href = '/dashboard/create'} className="bg-[#FF7A00] hover:bg-[#E06D00] text-black font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer">
          ⚡ Form a Team to Recruit
        </button>
      </div>

      <div className="bg-[#0B132B] border border-gray-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="text" placeholder="🔍 Search skill (e.g. PyTorch, YOLO, Figma)..." value={skillSearch} onChange={(e) => setSkillInput(e.target.value)} className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white" />
        <select className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white"><option>All Technical Roles</option></select>
        <select className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white"><option>All Interested SIH Themes</option></select>
        <select className="bg-[#070D18] border border-gray-700 text-xs px-3.5 py-2.5 rounded-xl text-white"><option>All Academic Years</option></select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {candidates.map((c, idx) => (
          <div key={idx} className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-6 relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-black font-extrabold flex items-center justify-center text-sm">
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{c.name}</h3>
                <p className="text-xs text-amber-400 font-medium">{c.role}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{c.college}</p>
              </div>
            </div>

            <div className="bg-[#070D18] border border-gray-800/80 p-3 rounded-xl space-y-1.5 text-[11px]">
              <span className="text-[10px] font-mono text-emerald-400 font-bold block">🔥 WHY THEY MATCH</span>
              <p className="text-gray-300">✓ Fills critical open technical role for your squad</p>
              <p className="text-gray-300">✓ Proficient in modern tools & architectures</p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-gray-500 block mb-1 uppercase">VERIFIED SKILLS</span>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s, i) => (
                  <span key={i} className="bg-[#070D18] border border-gray-800 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={() => handleInvite(c.name)} className="w-full bg-[#FF7A00] hover:bg-[#E06D00] text-black font-extrabold text-xs py-2.5 rounded-xl cursor-pointer">
              ⚡ Invite to Squad
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindTeammates;