import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { connectSocket } from '../../lib/socket';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket(user._id);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;