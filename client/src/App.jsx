import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HeaderTicker from './components/HeaderTicker';
import OnboardingModal from './components/OnboardingModal';

import BrowseTeams from './pages/BrowseTeams';
import FindTeammates from './pages/FindTeammates';
import MyTeam from './pages/MyTeam';
import CreateTeam from './pages/CreateTeam';
import Requests from './pages/Requests';
import Profile from './pages/Profile';

function AppLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if onboarding needs to be opened (only if profile is genuinely incomplete)
    const isComplete = Boolean(currentUser?.profileComplete || currentUser?.isProfileComplete);
    if (currentUser && !isComplete) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [currentUser]);

  const handleProfileComplete = (updatedUser) => {
    setCurrentUser(updatedUser);
    setShowOnboarding(false);
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const isProfileComplete = Boolean(currentUser?.profileComplete || currentUser?.isProfileComplete);

  return (
    <div className="min-h-screen bg-[#050A14] text-[#F8FAFC] flex flex-col font-sans relative">
      <HeaderTicker />
      <Navbar onOpenSetup={() => setShowOnboarding(true)} user={currentUser} />

      {/* Incomplete Profile Alert Reminder Banner */}
      {currentUser && !isProfileComplete && (
        <div className="bg-[#261E0C] border-b border-[#785412] px-6 py-2.5 flex items-center justify-between text-xs font-mono text-[#FBBF24]">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Profile incomplete! Complete your class, section, role & skills to be discoverable in Find Teammates.</span>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="bg-[#F59E0B] text-black font-black px-3.5 py-1 rounded-lg hover:bg-amber-400 cursor-pointer text-[11px]"
          >
            ⚡ Complete Setup
          </button>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal
          user={currentUser}
          onComplete={handleProfileComplete}
        />
      )}

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {React.cloneElement(children, { currentUser, onUpdateUser: setCurrentUser })}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0B132B',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '0.75rem',
            fontSize: '13px'
          }
        }}
      />

      <Routes>
        {/* 1. Public Landing / Home Page — viewable without login */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Public Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* 3. Gated App Pages (Behind ProtectedRoute) */}
        <Route 
          path="/team" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <MyTeam />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teammates" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <FindTeammates />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <BrowseTeams />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/requests" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Requests />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/create-team" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateTeam />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teams/:id" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <MyTeam />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Route Aliases for Seamless Navigation */}
        <Route path="/my-team" element={<Navigate to="/team" replace />} />
        <Route path="/form-team" element={<Navigate to="/create-team" replace />} />
        <Route path="/dashboard/my-team" element={<Navigate to="/team" replace />} />
        <Route path="/dashboard/browse" element={<Navigate to="/teams" replace />} />
        <Route path="/dashboard/teammates" element={<Navigate to="/teammates" replace />} />
        <Route path="/dashboard/create" element={<Navigate to="/create-team" replace />} />
        <Route path="/dashboard/requests" element={<Navigate to="/requests" replace />} />
        <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/dashboard" element={<Navigate to="/teams" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;