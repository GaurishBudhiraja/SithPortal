import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import AuthGuard from './components/auth/AuthGuard';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen sith-bg">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f1f1f',
              color: '#dc2626',
              border: '1px solid #dc2626',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)',
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;