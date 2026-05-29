import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth, setLoading } from './store/slices/authSlice';
import api from './utils/api';
import { socket } from './socket';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import { CallOverlay } from './components/common/CallOverlay';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import DemoRoom from './pages/DemoRoom';
import PostMeeting from './pages/PostMeeting';
import Account from './pages/Account';

function App() {
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        dispatch(setAuth(data.user));
      } catch (error) {
        dispatch(setAuth(null));
      }
    };
    checkAuth();
  }, [dispatch]);

  // Connect global socket when authenticated
  useEffect(() => {
    if (isAuthenticated && !socket.connected) {
      socket.connect();
    } else if (!isAuthenticated && socket.connected) {
      socket.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-text font-heading text-2xl animate-pulse">Loading ConnectSphere...</div>;
  }

  return (
    <Router>
      <CallOverlay />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/demo" element={<DemoRoom />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/post-meeting" element={<PostMeeting />} />
          <Route path="/account" element={<Account />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
