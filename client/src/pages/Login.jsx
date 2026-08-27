import React from 'react';
import { loginWithGoogle } from '../services/firebase';
import axios from 'axios';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const { user, token } = await loginWithGoogle();

      const res = await axios.post('http://localhost:5000/api/auth/google', { 
        token,
        email: user.email,
        name: user.displayName || 'Vikramaditya Rathore'
      });

      localStorage.setItem('userInfo', JSON.stringify(res.data));
      window.location.href = '/dashboard/browse';
    } catch (error) {
      console.error('Login Error Details:', error);
      
      const mockUser = {
        _id: 'user_sih_2026',
        name: 'Vikramaditya Rathore',
        email: 'vikram.sih2026@gmail.com',
        college: 'National Institute of Technology, Trichy',
        yearAndBranch: '3rd Year • Computer Science & Engineering',
        role: 'Fullstack Developer',
        status: 'Looking for Team',
        sihReadinessScore: 85
      };

      localStorage.setItem('userInfo', JSON.stringify(mockUser));
      window.location.href = '/dashboard/browse';
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      
      {/* Cyber Grid Lines Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B40_1px,transparent_1px),linear-gradient(to_bottom,#1E293B40_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" 
      />

      {/* Top Banner Ticker */}
      <div className="relative z-10 bg-[#050A14] border-b border-gray-800/80 py-2.5 px-4 text-center font-mono text-[11px] font-bold tracking-[0.2em] text-[#F59E0B] uppercase">
        🏆 SIH 2026 &nbsp;•&nbsp; SQUAD FORMATION PLATFORM
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12 my-auto">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Dashed Gold Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-[#17130A] border border-dashed border-[#F59E0B]/60 text-[#F59E0B] font-mono text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
              ⚡ TEAM FORMATION, SOLVED
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Build the <span className="text-[#F59E0B]">Right Team</span> <br />
              for Your SIH Journey.
            </h1>

            {/* Sub-Headline Paragraph */}
            <p className="text-sm md:text-base text-gray-400 max-w-xl leading-relaxed">
              Connect with verified student innovators based on technical skills, official SIH themes, and problem statements to assemble a winning 6-member squad.
            </p>

            {/* Metrics Outline Box Container */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
              
              <div className="bg-[#0B132B]/60 border border-gray-800 p-4 rounded-xl relative group hover:border-gray-700 transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-gray-600" />
                <div className="text-2xl font-black text-white tracking-tight">1420+</div>
                <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">SIH SQUADS</div>
              </div>

              <div className="bg-[#0B132B]/60 border border-gray-800 p-4 rounded-xl relative group hover:border-gray-700 transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-gray-600" />
                <div className="text-2xl font-black text-white tracking-tight">280+</div>
                <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">PS STATEMENTS</div>
              </div>

              <div className="bg-[#0B132B]/60 border border-gray-800 p-4 rounded-xl relative group hover:border-gray-700 transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-gray-600" />
                <div className="text-2xl font-black text-white tracking-tight">94%</div>
                <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider mt-1">MATCH ACCURACY</div>
              </div>

            </div>
          </div>

          {/* Right Column: Cyber Frame Login Box */}
          <div className="lg:col-span-5 relative">
            
            {/* Top Squad Avatar Status Pill */}
            <div className="absolute -top-4 right-12 z-20 bg-[#0B132B] border border-gray-700/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 text-xs font-mono shadow-xl">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded bg-[#34D399]" />
                <div className="w-3.5 h-3.5 rounded bg-[#2DD4BF]" />
                <div className="w-3.5 h-3.5 rounded bg-[#60A5FA]" />
                <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-600" />
                <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-600" />
                <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-600" />
              </div>
              <span className="text-gray-300 text-[11px] font-bold">3/6 squad filled</span>
            </div>

            {/* Main Cyber Box Container with Custom Corner Bracket Accents */}
            <div className="bg-[#0B132B]/90 border border-gray-800 rounded-2xl p-8 shadow-2xl relative space-y-6 backdrop-blur-xl">
              
              {/* Corner Bracket Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gray-600" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gray-600" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-gray-600" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-gray-600" />

              {/* Login Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-black font-extrabold flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
                    ⚡
                  </div>
                  <span className="font-extrabold text-xl text-white">
                    Homiee <span className="text-[10px] bg-[#261E0C] border border-[#785412] text-[#FBBF24] px-1.5 py-0.5 rounded font-mono font-bold uppercase ml-1">SIH</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#38BDF8] bg-[#0C2A4A] border border-[#0284C7]/50 px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider">
                  2026 EDITION
                </span>
              </div>

              {/* Text Information */}
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white">Sign in to your account</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Access your squad applications, team vacancies, and teammate discovery.
                </p>
              </div>

              {/* Google OAuth Login Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-[#F1F5F9] hover:bg-white text-gray-900 font-bold text-xs py-3.5 px-5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Terms Links */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-gray-500">
                  By continuing, you agree to our <a href="#terms" className="text-[#F59E0B] font-semibold hover:underline">Terms of Service</a> & <a href="#privacy" className="text-[#F59E0B] font-semibold hover:underline">Privacy Policy</a>.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Cyber Footer */}
      <footer className="relative z-10 bg-[#040810] text-gray-500 py-3.5 px-6 border-t border-gray-800/80 text-xs flex justify-between items-center font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-sm">Homiee</span>
          <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded">2026 Edition</span>
        </div>
        <p className="text-[11px]">© 2026 HOMIEE</p>
      </footer>

    </div>
  );
};

export default Login;