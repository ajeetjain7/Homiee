import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL;

const COMMON_THEMES = [
  'Travel and Tourism',
  'Smart Education & Learning',
  'Agriculture & Rural Development',
  'Clean & Renewable Green Technology',
  'Cybersecurity & Disaster Management',
  'Healthcare & Biomedical Devices',
  'Fintech & Web3 Blockchain',
  'Heritage, Culture & Tourism',
  'Smart Automation',
  'Miscellaneous'
];

const Winners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [sihTheme, setSihTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [psCode, setPsCode] = useState('');
  const [problemStatementTitle, setProblemStatementTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [experience, setExperience] = useState('');
  const [pptFile, setPptFile] = useState(null);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/winners`);
      if (Array.isArray(res.data)) {
        setWinners(res.data);
      }
    } catch (err) {
      console.error('Error fetching past winners:', err);
      toast.error('Failed to load past SIH winners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = /\.(ppt|pptx|pdf|odp)$/i;
      if (!validExtensions.test(file.name)) {
        toast.error('Please select a presentation file (.ppt, .pptx, .pdf).');
        return;
      }
      setPptFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    const selectedTheme = sihTheme === 'Custom' ? customTheme.trim() : sihTheme;

    if (!teamName.trim()) {
      return toast.error('Please enter the team name.');
    }
    if (!selectedTheme) {
      return toast.error('Please select or specify a SIH theme.');
    }
    if (!year || isNaN(year)) {
      return toast.error('Please enter a valid competition year.');
    }
    if (!experience.trim()) {
      return toast.error('Please provide the experience write-up.');
    }
    if (!pptFile) {
      return toast.error('Please attach a PPT presentation file.');
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('teamName', teamName.trim());
      formData.append('sihTheme', selectedTheme);
      formData.append('psCode', psCode.trim());
      formData.append('problemStatementTitle', problemStatementTitle.trim());
      formData.append('year', year);
      formData.append('experience', experience.trim());
      formData.append('ppt', pptFile);

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };

      await axios.post(`${API_BASE}/api/winners`, formData, config);

      toast.success('Past winner entry published successfully! 🏆');

      // Reset form & close modal
      setTeamName('');
      setSihTheme('');
      setCustomTheme('');
      setPsCode('');
      setProblemStatementTitle('');
      setYear(new Date().getFullYear());
      setExperience('');
      setPptFile(null);
      setShowUploadModal(false);

      // Refresh list
      fetchWinners();
    } catch (err) {
      console.error('Error uploading winner entry:', err);
      toast.error(err.response?.data?.message || 'Failed to upload winner entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (fileId, entryTeamName, originalFilename) => {
    if (!fileId) {
      toast.error('File ID missing.');
      return;
    }

    // Determine extension from original filename
    const extMatch = (originalFilename || '').match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0] : '.pptx';

    // Name the downloaded PPT file to the team name
    const cleanTeam = (entryTeamName || 'Presentation').trim().replace(/[\\/:*?"<>|]/g, '_');
    const downloadFilename = `${cleanTeam}${ext}`;

    const downloadUrl = `${API_BASE}/api/winners/${fileId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', downloadFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${downloadFilename}...`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-[#F8FAFC]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#1E293B]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
            SIH HALL OF FAME • {winners.length} WINNING SQUADS & PITCH DECKS
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Past SIH Winners</h1>
          <p className="text-xs text-[#CBD5E1]">
            Explore winning Smart India Hackathon teams, read their solutions and real competition journeys, and download their winning PPT pitch decks.
          </p>
        </div>

        {/* Action Button: Add Winner Entry */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <span className="text-sm">+</span> Add Winner Entry
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="w-64 h-8 bg-[#1E293B] rounded"></div>
              <div className="w-48 h-4 bg-[#1E293B] rounded"></div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-[#0B132B] rounded"></div>
                <div className="w-full h-4 bg-[#0B132B] rounded"></div>
                <div className="w-3/4 h-4 bg-[#0B132B] rounded"></div>
              </div>
              <div className="w-32 h-8 bg-[#1E293B] rounded-xl"></div>
              <hr className="border-[#1E293B] my-8" />
            </div>
          ))}
        </div>
      ) : winners.length === 0 ? (
        /* Empty State */
        <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#17130A] border border-[#785412] text-[#FBBF24] flex items-center justify-center text-3xl mx-auto">
            🏆
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">No Winner Entries Yet</h2>
            <p className="text-xs text-[#94A3B8]">
              Be the first to feature a winning SIH squad and showcase their pitch presentation!
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#F59E0B] hover:bg-[#E08D00] text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>+</span> Upload First Winner Entry
          </button>
        </div>
      ) : (
        /* Vertical Scrolling Paragraph List */
        <div className="space-y-10">
          {winners.map((entry, index) => {
            // Build subheading tagline parts
            const tagParts = [];
            if (entry.sihTheme) tagParts.push(entry.sihTheme);
            if (entry.psCode) tagParts.push(entry.psCode);
            if (entry.problemStatementTitle) tagParts.push(entry.problemStatementTitle);
            if (entry.year) tagParts.push(entry.year);

            return (
              <div key={entry._id} className="space-y-4 text-left">
                {/* 1. Large Bold Heading: Team Name */}
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {entry.teamName}
                </h2>

                {/* 2. Subheading / Tag Line: SIH Theme · PS Title/Code · Year */}
                <div className="text-xs sm:text-sm font-mono text-[#FBBF24] font-medium tracking-wide flex items-center gap-2 flex-wrap">
                  {tagParts.map((part, pIdx) => (
                    <React.Fragment key={pIdx}>
                      <span>{part}</span>
                      {pIdx < tagParts.length - 1 && (
                        <span className="text-[#64748B]">·</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* 3. Paragraph of Body Text: Experience Write-up (Flowing text, not truncated, not boxed) */}
                <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed whitespace-pre-line font-normal">
                  {entry.experience}
                </p>

                {/* 4. Download PPT button/link */}
                <div className="pt-2">
                  <button
                    onClick={() => handleDownload(entry.pptFileId, entry.teamName, entry.pptFilename)}
                    className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#E08D00] text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>📥</span>
                    <span>Download PPT</span>
                  </button>
                </div>

                {/* 5. Visual Divider (separating entries) */}
                {index < winners.length - 1 && (
                  <hr className="border-[#1E293B] pt-6 my-6 sm:my-8" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#261E0C] border border-[#785412] text-[#FBBF24] flex items-center justify-center text-sm">
                  🏆
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Add Past SIH Winner</h2>
                  <p className="text-[11px] text-[#94A3B8]">Store winning pitch presentation in MongoDB GridFS</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={submitting}
                className="text-[#94A3B8] hover:text-white text-lg font-mono p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                  Team Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Power Rangers / SkillVista"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#64748B]"
                />
              </div>

              {/* SIH Theme & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                    SIH Theme <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={sihTheme}
                    onChange={(e) => setSihTheme(e.target.value)}
                    required
                    className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] cursor-pointer"
                  >
                    <option value="">Select SIH Theme</option>
                    {COMMON_THEMES.map((theme) => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                    <option value="Custom">+ Enter Custom Theme</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                    Competition Year <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="2017"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all"
                  />
                </div>
              </div>

              {/* Custom Theme Field (Conditional) */}
              {sihTheme === 'Custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                    Custom Theme Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter custom theme title..."
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    required
                    className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#64748B]"
                  />
                </div>
              )}

              {/* Optional PS Code & Problem Statement Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                    PS Code <span className="text-[#94A3B8] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SIH25032"
                    value={psCode}
                    onChange={(e) => setPsCode(e.target.value)}
                    className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#64748B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                    Problem Statement Title <span className="text-[#94A3B8] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jharkhand Express"
                    value={problemStatementTitle}
                    onChange={(e) => setProblemStatementTitle(e.target.value)}
                    className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#64748B]"
                  />
                </div>
              </div>

              {/* Experience Write-Up */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                  Experience & Winning Advice <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Share what the team built, solution approach, mentoring experience, pitch delivery secrets, and key takeaways for future participants..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                  className="w-full bg-[#070D18] border border-[#334155] text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-[#F59E0B] transition-all placeholder-[#64748B]"
                />
              </div>

              {/* PPT File Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[#CBD5E1]">
                  PPT Pitch Deck File (.ppt, .pptx, .pdf) <span className="text-amber-400">*</span>
                </label>
                <div className="border border-dashed border-[#334155] hover:border-[#F59E0B] rounded-xl p-4 bg-[#070D18] transition-colors text-center">
                  <input
                    type="file"
                    id="ppt-upload-modal"
                    accept=".ppt,.pptx,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="ppt-upload-modal"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-[#94A3B8]"
                  >
                    <span className="text-2xl">📁</span>
                    {pptFile ? (
                      <span className="font-mono text-[#FBBF24] font-bold break-all">
                        {pptFile.name} ({(pptFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    ) : (
                      <>
                        <span className="text-white font-bold">Click to browse presentation file</span>
                        <span className="text-[10px] text-[#64748B]">PowerPoint (.pptx, .ppt) or PDF up to 50MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-mono text-[#CBD5E1] hover:text-white bg-[#070D18] border border-[#334155] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Uploading to GridFS...</span>
                    </>
                  ) : (
                    <>
                      <span>🏆</span>
                      <span>Publish Winner Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Winners;
