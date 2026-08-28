import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeaderTicker from '../components/HeaderTicker';

const LandingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');
  const isAuthenticated = Boolean(token || userInfo);

  return (
    <div className="min-h-screen bg-[#050A14] text-[#F8FAFC] flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* Top Banner Ticker */}
      <HeaderTicker />

      {/* Dynamic Navbar: shows Login/Signup if guest, or full nav if authenticated */}
      <Navbar />

      {/* Cyber Grid Lines Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B33_1px,transparent_1px),linear-gradient(to_bottom,#1E293B33_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" 
      />

      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 bg-[#17130A] border border-[#F59E0B]/70 text-[#FBBF24] font-mono text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/10">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
          🏆 SMART INDIA HACKATHON 2026 • OFFICIAL TEAM FORMATION
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.08] tracking-tight max-w-5xl">
          Build the <span className="text-[#F59E0B] underline decoration-[#F59E0B]/40 decoration-wavy">Winning Squad</span> <br className="hidden sm:inline" />
          for Your SIH 2026 Journey.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl font-normal leading-relaxed">
          Connect with verified student innovators based on technical skills, PPT presentation strengths, gender diversity criteria, and official problem statements.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
          <Link
            to="/teammates"
            className="w-full sm:w-auto bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black text-sm px-8 py-4 rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            ⚡ Find SIH Teammates
          </Link>
          <Link
            to="/teams"
            className="w-full sm:w-auto bg-[#0B132B] hover:bg-[#16223D] border border-[#334155] hover:border-[#64748B] text-[#F8FAFC] font-extrabold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            🔍 Explore Open Squads
          </Link>
          <Link
            to="/form-team"
            className="w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E293B] border border-amber-500/40 text-[#FBBF24] font-bold text-sm px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            + Create a Squad
          </Link>
        </div>

        {/* High-Contrast Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-center w-full max-w-5xl pt-10">
          

          <div className="bg-[#0B132B] border border-[#1E293B] hover:border-amber-500/50 p-5 rounded-2xl text-left space-y-1 transition-all shadow-xl">
            <div className="text-3xl font-black text-[#38BDF8]">200+</div>
            <div className="text-xs font-mono font-bold text-[#E2E8F0] uppercase tracking-wider">Problem Statements</div>
            <p className="text-[11px] text-[#94A3B8]">Software & Hardware editions</p>
          </div>

          <div className="bg-[#0B132B] border border-[#1E293B] hover:border-amber-500/50 p-5 rounded-2xl text-left space-y-1 transition-all shadow-xl">
            <div className="text-3xl font-black text-[#34D399]">94%</div>
            <div className="text-xs font-mono font-bold text-[#E2E8F0] uppercase tracking-wider">Match Accuracy</div>
            <p className="text-[11px] text-[#94A3B8]">Skill & role complement scoring</p>
          </div>

          <div className="bg-[#0B132B] border border-[#1E293B] hover:border-amber-500/50 p-5 rounded-2xl text-left space-y-1 transition-all shadow-xl">
            <div className="text-3xl font-black text-[#F43F5E]">6 / 6</div>
            <div className="text-xs font-mono font-bold text-[#E2E8F0] uppercase tracking-wider">Roster Compliance</div>
            <p className="text-[11px] text-[#94A3B8]">Mandatory female diversity match</p>
          </div>
        </div>

        {/* Feature Highlights Section */}
        <div className="w-full max-w-5xl pt-16 space-y-8 text-left">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-[#F59E0B] font-bold tracking-widest uppercase">Everything You Need To Win</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Engineered For Hackathon Champions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#0B132B] border border-[#1E293B] p-6 rounded-2xl space-y-3 shadow-xl hover:border-[#334155] transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#F59E0B] flex items-center justify-center text-xl font-bold">
                🎯
              </div>
              <h3 className="text-lg font-bold text-white">Smart PS Code Matching</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Filter and match squads directly by official SIH Problem Statement codes, ministry tracks, and software/hardware editions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0B132B] border border-[#1E293B] p-6 rounded-2xl space-y-3 shadow-xl hover:border-[#334155] transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-[#2DD4BF] flex items-center justify-center text-xl font-bold">
                📊
              </div>
              <h3 className="text-lg font-bold text-white">PPT & Role Balancing</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Discover teammates specializing in pitch deck creation, UI prototyping, backend architectures, and edge AI models.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0B132B] border border-[#1E293B] p-6 rounded-2xl space-y-3 shadow-xl hover:border-[#334155] transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-[#38BDF8] flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white">Instant Teammate Cards</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                One-time quick setup publishes your verified profile card with college, branch, section, GitHub, and LeetCode handles.
              </p>
            </div>

          </div>
        </div>

        {/* Ready to Assemble Call-to-Action Banner */}
        <div className="w-full max-w-5xl bg-gradient-to-r from-[#17130A] via-[#0B132B] to-[#17130A] border border-[#F59E0B]/50 p-8 md:p-12 rounded-3xl text-center space-y-5 my-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-2xl md:text-4xl font-black text-white">Ready to Assemble Your 6-Member Squad?</h2>
          <p className="text-xs md:text-sm text-[#CBD5E1] max-w-xl mx-auto">
            Join thousands of student innovators across India already building problem statement solutions for Smart India Hackathon.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black text-xs px-8 py-3.5 rounded-xl shadow-lg transition-all"
                >
                  ⚡ Sign In with Google
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="bg-[#0F172A] hover:bg-[#1E293B] border border-gray-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl transition-all"
                >
                  Create Free Account
                </Link>
              </>
            ) : (
              <Link
                to="/teammates"
                className="bg-[#F59E0B] hover:bg-[#E08D00] text-[#000000] font-black text-xs px-8 py-3.5 rounded-xl shadow-lg transition-all"
              >
                ⚡ Go to Teammate Discovery
              </Link>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#040810] text-[#94A3B8] py-6 px-6 border-t border-[#1E293B] text-xs flex flex-col sm:flex-row justify-between items-center gap-4 font-mono">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Homiee" className="w-6 h-6 object-contain rounded-lg" />
          <span className="font-bold text-white text-sm">Homiee SIH</span>
          <span className="text-[10px] bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] px-2 py-0.5 rounded">2026 Edition</span>
        </div>
        <p className="text-[11px]">© 2026 HOMIEE • Smart India Hackathon Team Formation Platform</p>
      </footer>

    </div>
  );
};

export default LandingPage;

