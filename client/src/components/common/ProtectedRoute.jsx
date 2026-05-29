import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
