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

  const [isSignUp, setIsSignUp] = useState(() => searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  // Email & Password Submit Handler
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp 
        ? `${API_BASE}/api/auth/register` 
        : `${API_BASE}/api/auth/login`;

      const payload = isSignUp ? { name, email, password } : { email, password };
      const res = await axios.post(endpoint, payload);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data));

      toast.success(isSignUp ? 'Account created successfully!' : `Welcome back, ${res.data.name || 'Innovator'}!`);

      const isComplete = Boolean(res.data.profileComplete || res.data.isProfileComplete);
      if (!isComplete) {
        navigate('/teammates', { state: { openSetup: true } });
      } else {
        navigate('/teammates');
      }
    } catch (err) {
      console.error('Email Auth Error:', err);
      toast.error(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Instant Demo Login for Offline Testing
  const handleDemoLogin = (isNew = true) => {
    if (isNew) {
      const newUser = {
        _id: 'user_' + Date.now(),
        name: 'Aryan Sharma',
        email: 'aryan.sharma2026@gmail.com',
        college: '',
        classBranch: '',
        section: '',
        year: '3rd Year',
        gender: 'Male',
        primaryRole: 'Fullstack Developer',
        capabilities: ['PPT Making & Pitch Deck', 'Backend & APIs'],
        technicalSkills: ['React', 'PPT Making', 'Node.js', 'MongoDB'],
        sihThemes: ['Clean & Renewable Green Technology'],
        about: '',
        profileComplete: false,
        isProfileComplete: false,
        sihReadinessScore: 20
      };
      localStorage.setItem('token', 'demo_jwt_token_new');
      localStorage.setItem('userInfo', JSON.stringify(newUser));
      navigate('/teammates', { state: { openSetup: true } });
    } else {
      const existingUser = {
        _id: 'user_sih_2026',
        name: 'Vikramaditya Rathore',
        email: 'vikram.sih2026@gmail.com',
        college: 'IET DAVV, Indore',
        classBranch: 'B.Tech Computer Science & Engineering',
        section: 'Section B',
        year: '3rd Year',
        yearAndBranch: '3rd Year • B.Tech CSE (Section B)',
        gender: 'Male',
        primaryRole: 'Fullstack Developer',
        capabilities: ['PPT Making & Pitch Deck', 'Frontend UI / UX', 'Backend & APIs'],
        technicalSkills: ['React', 'Node.js', 'MongoDB', 'PPT Making', 'Canva', 'TailwindCSS'],
        sihThemes: ['Agriculture & Rural Development', 'Smart Education & Learning'],
        about: 'Passionate fullstack engineer & pitch presentation designer. 3 hackathons won, looking for enthusiastic teammates for SIH 2026.',
        github: 'https://github.com/vikram-rathore',
        linkedin: 'https://linkedin.com/in/vikram-rathore',
        portfolio: 'https://vikramaditya.dev',
        leetcodeRating: '1920 (Knight)',
        profileComplete: true,
        isProfileComplete: true,
        sihReadinessScore: 90
      };
      localStorage.setItem('token', 'demo_jwt_token_existing');
      localStorage.setItem('userInfo', JSON.stringify(existingUser));
      navigate('/teammates');
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
                <div className="text-2xl font-black text-white tracking-tight">1420+</div>
                <div className="text-[10px] font-mono text-[#E2E8F0] font-bold uppercase tracking-wider mt-1">SIH SQUADS</div>
              </div>

              <div className="bg-[#0B132B] border border-[#1E293B] p-4 rounded-xl relative group hover:border-[#334155] transition-all">
                <div className="absolute -top-1 left-3 w-4 h-0.5 bg-sky-500" />
                <div className="text-2xl font-black text-white tracking-tight">280+</div>
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

              {/* Auth Mode Toggle */}
              <div className="grid grid-cols-2 bg-[#070D18] p-1 rounded-xl border border-[#1E293B] text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${!isSignUp ? 'bg-[#F59E0B] text-black shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${isSignUp ? 'bg-[#F59E0B] text-black shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Create Account
                </button>
              </div>

              {/* Google OAuth Login Button (Prominent) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1E293B]"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono text-[#94A3B8] uppercase">OR EMAIL & PASSWORD</span>
                <div className="flex-grow border-t border-[#1E293B]"></div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#CBD5E1] mb-1 font-bold">FULL NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shivam Purohit"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-[#CBD5E1] mb-1 font-bold">COLLEGE / PERSONAL EMAIL</label>
                  <input
                    type="email"
                    required
                    placeholder="you@college.edu or gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#CBD5E1] mb-1 font-bold">PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#070D18] border border-[#334155] focus:border-[#F59E0B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Create Account & Continue →' : 'Sign In with Email →')}
                </button>
              </form>

              {/* Instant Demo Login Buttons */}
              <div className="pt-2 border-t border-[#1E293B] space-y-2">
                <span className="block text-[10px] font-mono text-center text-[#94A3B8] uppercase">QUICK DEMO ACCESS:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(true)}
                    className="bg-[#17130A] border border-[#F59E0B]/60 hover:border-[#F59E0B] text-[#FBBF24] font-mono font-bold text-[10px] py-2 px-2.5 rounded-xl transition-all text-center cursor-pointer"
                  >
                    ⚡ New Innovator (Setup)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(false)}
                    className="bg-[#070D18] border border-[#334155] hover:border-gray-400 text-[#CBD5E1] font-mono font-bold text-[10px] py-2 px-2.5 rounded-xl transition-all text-center cursor-pointer"
                  >
                    👤 Existing Member
                  </button>
                </div>
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