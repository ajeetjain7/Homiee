import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { loginWithGoogle } from '../services/firebase';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const API_BASE = getApiBase();

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Google OAuth Handler (Direct Firebase Google Sign-In with MongoDB Profile Sync)
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user: gUser, token: fbToken } = await loginWithGoogle();
      
      const payload = {
        token: fbToken,
        googleId: gUser.uid || gUser.providerData?.[0]?.uid || '',
        email: gUser.email,
        name: gUser.displayName || 'Student Innovator',
        photoUrl: gUser.photoURL || '',
        avatar: gUser.photoURL || ''
      };

      const res = await axios.post(`${API_BASE}/api/auth/google`, payload);

      localStorage.setItem('token', res.data.token || fbToken);
      localStorage.setItem('userInfo', JSON.stringify(res.data));

      toast.success(`Welcome, ${res.data.name || 'Innovator'}!`);

      // Server-driven profile completeness verification
      const isComplete = Boolean(res.data.profileComplete || res.data.isProfileComplete);
      if (!isComplete) {
        navigate('/teammates', { state: { openSetup: true } });
      } else {
        navigate('/teammates');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast('Google sign-in popup was closed.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-[#F8FAFC] flex flex-col justify-between font-sans relative overflow-hidden select-none">
      
      {/* Cyber Grid Lines Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B33_1px,transparent_1px),linear-gradient(to_bottom,#1E293B33_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" 
      />

      {/* Top Banner Ticker */}
      <div className="relative z-10 bg-[#040810] border-b border-[#1E293B] py-2.5 px-4 text-center font-mono text-[11px] font-bold tracking-[0.2em] text-[#F59E0B] uppercase">
        🏆 SIH 2026 &nbsp;•&nbsp; SQUAD FORMATION PLATFORM
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12 my-auto">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Dashed Gold Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-[#17130A] border border-dashed border-[#F59E0B]/70 text-[#FBBF24] font-mono text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
              ⚡ TEAM FORMATION, SOLVED
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Build the <span className="text-[#F59E0B]">Right Team</span> <br />
              for Your SIH Journey.
            </h1>

            {/* Sub-Headline Paragraph */}
            <p className="text-sm md:text-base text-[#CBD5E1] max-w-xl leading-relaxed">
              Connect with verified student innovators based on technical skills, official SIH themes, and problem statements to assemble a winning 6-member squad.
            </p>

            {/* Metrics Outline Box Container */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
              
              <div className="bg-[#0B132B] border border-[#1E293B] p-4 rounded-xl relative group hover:border-[#334155] transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-amber-500" />
                <div className="text-2xl font-black text-white tracking-tight">95%</div>
                <div className="text-[10px] font-mono text-[#E2E8F0] font-bold uppercase tracking-wider mt-1">REAL SQUADS</div>
              </div>

              <div className="bg-[#0B132B] border border-[#1E293B] p-4 rounded-xl relative group hover:border-[#334155] transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-sky-500" />
                <div className="text-2xl font-black text-white tracking-tight">200+</div>
                <div className="text-[10px] font-mono text-[#E2E8F0] font-bold uppercase tracking-wider mt-1">PS STATEMENTS</div>
              </div>

              <div className="bg-[#0B132B] border border-[#1E293B] p-4 rounded-xl relative group hover:border-[#334155] transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-emerald-500" />
                <div className="text-2xl font-black text-white tracking-tight">94%</div>
                <div className="text-[10px] font-mono text-[#E2E8F0] font-bold uppercase tracking-wider mt-1">MATCH ACCURACY</div>
              </div>

            </div>
          </div>

          {/* Right Column: High-Contrast Auth Box */}
          <div className="lg:col-span-5 relative">
            
            {/* Top Squad Avatar Status Pill */}
            <div className="absolute -top-4 right-10 z-20 bg-[#0B132B] border border-[#334155] px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 text-xs font-mono shadow-xl">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[#34D399]" />
                <div className="w-3 h-3 rounded bg-[#2DD4BF]" />
                <div className="w-3 h-3 rounded bg-[#60A5FA]" />
                <div className="w-3 h-3 rounded border border-dashed border-gray-500" />
                <div className="w-3 h-3 rounded border border-dashed border-gray-500" />
                <div className="w-3 h-3 rounded border border-dashed border-gray-500" />
              </div>
              <span className="text-[#E2E8F0] text-[11px] font-bold">3/6 squad filled</span>
            </div>

            {/* Main Cyber Box Container with Custom Corner Bracket Accents */}
            <div className="bg-[#0B132B] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative space-y-5 backdrop-blur-xl">
              
              {/* Corner Bracket Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/60" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/60" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/60" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/60" />

              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-black font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
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

              {/* Single Google Sign-In Action */}
              <div className="space-y-4 pt-2">
                <p className="text-xs text-[#CBD5E1] text-center leading-relaxed">
                  Sign in with your Google account to access your SIH squad dashboard and find teammates.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Security & Verification Notice */}
              <div className="bg-[#070D18] border border-[#1E293B] p-3 rounded-xl flex items-center gap-2.5 text-[11px] font-mono text-[#94A3B8]">
                <span className="text-emerald-400 font-bold">🔒</span>
                <span>Direct Google OAuth verification • Official SIH 2026</span>
              </div>

              {/* Terms Links */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-[#94A3B8]">
                  By continuing, you agree to our <a href="#terms" className="text-[#F59E0B] font-semibold hover:underline">Terms of Service</a> & <a href="#privacy" className="text-[#F59E0B] font-semibold hover:underline">Privacy Policy</a>.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#040810] text-[#94A3B8] py-3.5 px-6 border-t border-[#1E293B] text-xs flex justify-between items-center font-mono">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-bold text-white text-sm hover:underline">← Back to Home</Link>
          <span className="text-[10px] bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] px-2 py-0.5 rounded">2026 Edition</span>
        </div>
        <p className="text-[11px]">© 2026 HOMIEE</p>
      </footer>

    </div>
  );
};

export default Login;
