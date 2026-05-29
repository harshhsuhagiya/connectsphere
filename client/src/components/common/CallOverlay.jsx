import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';
import { socket } from '../../socket';
import UserAvatar from './UserAvatar';

export const CallOverlay = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringingAudio] = useState(new Audio('https://assets.mixkit.co/sfx/preview/mixkit-phone-ring-1354.mp3'));
  const navigate = useNavigate();

  useEffect(() => {
    ringingAudio.loop = true;

    const handleIncoming = ({ callerProfile, callerSocketId }) => {
      setIncomingCall({ callerProfile, callerSocketId });
      ringingAudio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleCallCanceled = () => {
      setIncomingCall(null);
      ringingAudio.pause();
      ringingAudio.currentTime = 0;
    };

    socket.on('incoming-call', handleIncoming);
    socket.on('call-canceled', handleCallCanceled);

    return () => {
      socket.off('incoming-call', handleIncoming);
      socket.off('call-canceled', handleCallCanceled);
      ringingAudio.pause();
    };
  }, [ringingAudio]);

  const acceptCall = () => {
    ringingAudio.pause();
    const roomId = `direct-${Date.now()}`;
    socket.emit('accept-call', { to: incomingCall.callerSocketId, roomId });
    navigate(`/room/${roomId}`);
    setIncomingCall(null);
  };

  const declineCall = () => {
    ringingAudio.pause();
    socket.emit('decline-call', { to: incomingCall.callerSocketId });
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] bg-surface rounded-2xl shadow-2xl border border-border p-6 flex flex-col items-center min-w-[300px]"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <UserAvatar name={incomingCall.callerProfile?.name} src={incomingCall.callerProfile?.avatar} size="lg" className="relative z-10" />
          </div>
          
          <h3 className="text-xl font-heading mb-1">{incomingCall.callerProfile?.name || 'Unknown Caller'}</h3>
          <p className="text-sm text-textSecondary mb-6 flex items-center gap-2">
            <PhoneIncoming size={14} className="animate-pulse text-green-500" /> ConnectSphere Video Call
          </p>

          <div className="flex gap-6 w-full justify-center">
            <button onClick={declineCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
              <PhoneOff size={24} />
            </button>
            <button onClick={acceptCall} className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
              <Phone size={24} className="animate-bounce" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
