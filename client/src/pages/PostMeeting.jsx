import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import UserAvatar from '../components/common/UserAvatar';

const PostMeeting = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Safely fallback if user navigates here directly
  const duration = state?.duration || 0;
  const roomId = state?.roomId;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
    >
      <div className="ag-card max-w-md w-full text-center py-12 px-8 flex flex-col items-center shadow-xl border-t-4 border-t-primary">
        <h1 className="text-3xl font-heading text-text mb-8">Meeting Ended</h1>
        
        <UserAvatar name={user?.name} src={user?.avatar} size="xl" className="mb-8" />
        
        <h2 className="text-2xl font-medium mb-1">{user?.name}</h2>
        <p className="text-textSecondary mb-8 text-lg">Duration: <span className="font-mono text-text">{formatDuration(duration)}</span></p>
        
        <div className="flex gap-4 w-full">
          <button onClick={() => navigate('/dashboard')} className="flex-1 ag-input bg-surface hover:bg-gray-50 font-medium transition-colors cursor-pointer text-center">
            Go to Dashboard
          </button>
          {roomId && (
            <button onClick={() => navigate(`/room/${roomId}`)} className="flex-1 ag-btn">
              Rejoin
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PostMeeting;
