import React from 'react';
import { loginWithGoogle } from '../services/firebase';
import axios from 'axios';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const { user, token } = await loginWithGoogle();

      // Send Firebase token AND user details to Express/MongoDB backend
      const res = await axios.post('http://localhost:5000/api/auth/google', { 
        token,
        email: user.email,
        name: user.displayName || 'Dev User'
      });

      // Save user session (including MongoDB _id)
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      alert(`Welcome, ${res.data.name || user.displayName || 'Dev'}!`);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login Error Details:', error);
      alert(error.response?.data?.message || 'Google Sign-In Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col justify-between px-6 md:px-16 lg:px-20 py-8 relative overflow-hidden font-sans">
      
      {/* Background Subtle Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Homiee</span>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-10">
        
        {/* Left Column: Hero Copy & CTA */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-block text-xs font-mono text-gray-400 tracking-wider uppercase">
            // TEAM FORMATION, SOLVED
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.15]">
            Build your <br />
            <span className="relative inline-block text-amber-400 underline decoration-amber-500/80 decoration-wavy decoration-2 underline-offset-8">
              dream team
            </span> <br />
            for hackathons
          </h1>

          <p className="text-sm md:text-base text-gray-400 max-w-xl leading-relaxed">
            Post open roles or browse rosters that need you. Send a request with your proof of work, get picked, and start building — no more scrambling in WhatsApp groups the night before.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              className="bg-[#F8FAFC] hover:bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl transition-all flex items-center gap-3 shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono tracking-wider text-gray-500 pt-2 uppercase">
            <span>FAST SIGN-UP</span> • <span>INSTANT PROFILE</span> • <span>100% FREE FOR STUDENTS</span>
          </div>
        </div>

        {/* Right Column: Stacked Interactive Card Previews */}
        <div className="lg:col-span-6 relative flex justify-center items-center py-6">
          
          {/* Background Layer Card (Floating behind) */}
          <div className="absolute top-0 right-4 w-[85%] bg-[#111622] border border-gray-800 rounded-2xl p-4 text-xs opacity-50 blur-[0.5px] rotate-3 scale-95 pointer-events-none">
            <div className="flex justify-between items-center text-gray-400 mb-2">
              <span className="font-bold">ByteBusters</span>
              <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px]">OPEN</span>
            </div>
            <p className="text-gray-500">Building Smart Transit for HackIndore 2026...</p>
          </div>

          {/* Featured Front Card */}
          <div className="relative w-full max-w-md bg-[#0F1420] border border-gray-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            
            {/* Status Ribbon */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">
                #1 RANKED
              </span>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                OPEN
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Null Pointers</h3>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-3">
              <span>🏆</span> SIH — Indore Regionals
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              AI-assisted crop advisory app for the agritech track. Need someone comfortable with REST APIs, MongoDB, and authentication.
            </p>

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-[#182030] text-gray-300 border border-gray-700/60 text-[11px] px-2.5 py-1 rounded-md font-mono">
                Node.js
              </span>
              <span className="bg-[#182030] text-gray-300 border border-gray-700/60 text-[11px] px-2.5 py-1 rounded-md font-mono">
                MongoDB
              </span>
              <span className="bg-[#182030] text-gray-300 border border-gray-700/60 text-[11px] px-2.5 py-1 rounded-md font-mono">
                React
              </span>
            </div>

            {/* Member Avatars & Progress */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/80 mb-4">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center border-2 border-[#0F1420]">AJ</div>
                <div className="w-7 h-7 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center border-2 border-[#0F1420]">PN</div>
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0F1420]">DR</div>
                <div className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold flex items-center justify-center border-2 border-[#0F1420] border-dashed">+2</div>
              </div>
              <span className="text-xs text-gray-400 font-mono">3/5 filled</span>
            </div>

            {/* Needed Role Badge */}
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 mb-4 flex justify-between items-center text-xs">
              <span className="text-amber-300 font-semibold">NEEDS: Backend Dev</span>
              <span className="text-[10px] text-amber-400/80">IET DAVV</span>
            </div>

            {/* Simulated Action Button */}
            <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/20">
              View & request to join
            </button>

            {/* Codeforces Badge floating */}
            <div className="absolute -bottom-3 -right-3 bg-[#161C2A] border border-gray-700 text-gray-300 text-[10px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              CF 1480 verified
            </div>
          </div>

        </div>

      </main>

      {/* Footer Features */}
      <footer className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-950/60 border border-indigo-800/40 rounded-lg text-indigo-400">
            👤
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">Skill-based matching</h4>
            <p className="text-[11px] text-gray-400">Find your Homiees by exact role — React, Node, ML, or UI/UX design.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-950/60 border border-amber-800/40 rounded-lg text-amber-400">
            🏆
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">Campus leaderboards</h4>
            <p className="text-[11px] text-gray-400">Rank up on wins, GitHub activity, and past hackathon results.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Login;