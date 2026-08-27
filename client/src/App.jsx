import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#121624',
            color: '#fff',
            border: '1px solid #1f2937',
            borderRadius: '0.75rem',
            fontSize: '13px'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#121624',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#121624',
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;