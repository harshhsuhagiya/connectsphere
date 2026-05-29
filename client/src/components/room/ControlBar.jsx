import React, { useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MoreVertical, Hand, Users, Link as LinkIcon, Settings, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ControlBar = ({ onToggleAudio, onToggleVideo, onToggleScreenShare, onLeave, onRaiseHand, onMuteAll, onCopyLink }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const menuRef = useRef();

  const handleAudio = () => setIsAudioEnabled(onToggleAudio());
  const handleVideo = () => setIsVideoEnabled(onToggleVideo());
  const handleScreenShare = async () => setIsScreenSharing(await onToggleScreenShare(!isScreenSharing));

  const toggleRecording = () => {
    // Fake visual toggle for now. Real implementation requires canvas mixing or DisplayMedia
    setIsRecording(!isRecording);
    setMenuOpen(false);
    if (!isRecording) alert('Recording started (Demo Mode)');
    else alert('Recording saved locally (Demo Mode)');
  };

  return (
    <div className="h-20 bg-surface border-t border-border flex items-center justify-center gap-2 sm:gap-4 px-2 sm:px-6 z-50 relative shrink-0">
      <button onClick={handleAudio} className={`p-3 sm:p-4 rounded-full transition-colors ${isAudioEnabled ? 'bg-gray-100 hover:bg-gray-200 text-text' : 'bg-red-500 hover:bg-red-600 text-white shadow-md'}`}>
        {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      <button onClick={handleVideo} className={`p-3 sm:p-4 rounded-full transition-colors ${isVideoEnabled ? 'bg-gray-100 hover:bg-gray-200 text-text' : 'bg-red-500 hover:bg-red-600 text-white shadow-md'}`}>
        {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      <button onClick={handleScreenShare} className={`p-3 sm:p-4 rounded-full transition-colors ${isScreenSharing ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-text'}`}>
        <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div className="w-px h-8 bg-border mx-1 sm:mx-2"></div>

      {/* More Options Menu */}
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className={`p-3 sm:p-4 rounded-full transition-colors ${menuOpen ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-text'}`}>
          <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-56 bg-surface border border-border shadow-xl rounded-xl py-2 overflow-hidden z-50"
            >
              <button onClick={() => { onRaiseHand(); setMenuOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-sm text-left transition-colors">
                <Hand size={18} className="text-accent" /> Raise Hand
              </button>
              <button onClick={() => { onMuteAll(); setMenuOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-sm text-left transition-colors">
                <Users size={18} className="text-red-500" /> Mute Everyone (Host)
              </button>
              <button onClick={() => { onCopyLink(); setMenuOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-sm text-left transition-colors">
                <LinkIcon size={18} className="text-secondary" /> Copy Meeting Link
              </button>
              <button onClick={toggleRecording} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-sm text-left transition-colors">
                <Circle size={18} className={isRecording ? "text-red-500 animate-pulse" : "text-textSecondary"} /> 
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-sm text-left transition-colors text-textSecondary opacity-50 cursor-not-allowed">
                <Settings size={18} /> Settings (Coming Soon)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-8 bg-border mx-1 sm:mx-2"></div>

      <button onClick={onLeave} className="p-3 sm:p-4 px-6 sm:px-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2">
        <PhoneOff className="w-5 h-5" /> <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
};

export default ControlBar;
