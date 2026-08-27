import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Navbar from './components/Navbar';
import HeaderTicker from './components/HeaderTicker';

import BrowseTeams from './pages/BrowseTeams';
import FindTeammates from './pages/FindTeammates';
import MyTeam from './pages/Dashboard'; // Existing My Team view
import CreateTeam from './pages/CreateTeam';
import Requests from './pages/Requests';
import Profile from './pages/Profile';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col font-sans relative">
      <HeaderTicker />
      <Navbar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Routes>
          <Route path="browse" element={<BrowseTeams />} />
          <Route path="teammates" element={<FindTeammates />} />
          <Route path="my-team" element={<MyTeam />} />
          <Route path="create" element={<CreateTeam />} />
          <Route path="requests" element={<Requests />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="browse" replace />} />
        </Routes>
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
            color: '#fff',
            border: '1px solid #1f2937',
            borderRadius: '0.75rem',
            fontSize: '13px'
          }
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<DashboardLayout />} />
        <Route path="*" element={<Navigate to="/dashboard/browse" replace />} />
      </Routes>
    </Router>
  );
}

export default App;