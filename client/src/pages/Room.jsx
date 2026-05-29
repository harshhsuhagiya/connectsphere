import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/room/VideoGrid';
import ControlBar from '../components/room/ControlBar';
import Whiteboard from '../components/room/Whiteboard';
import ChatPanel from '../components/room/ChatPanel';
import FileDropzone from '../components/room/FileDropzone';
import api from '../utils/api';
import { MessageSquare, Layout, Grid, FolderOpen } from 'lucide-react';
import { socket } from '../socket'; // Global socket instance

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Connect socket if not connected
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  const { localStream, startLocalStream, peers, toggleMedia, replaceVideoTrack, cleanup } = useWebRTC(socket, roomId, user);
  
  const [isValidRoom, setIsValidRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalVideoTrack, setOriginalVideoTrack] = useState(null);
  
  const [activeTab, setActiveTab] = useState('video');
  const [rightPanel, setRightPanel] = useState('none');
  const [raisedHands, setRaisedHands] = useState({});
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const meetingStartTime = useRef(Date.now());

  useEffect(() => {
    const verifyRoom = async () => {
      try {
        await api.get(`/rooms/${roomId}`);
        setIsValidRoom(true);
        const stream = await startLocalStream();
        if (stream) setOriginalVideoTrack(stream.getVideoTracks()[0]);
      } catch (error) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    verifyRoom();

    // Socket Listeners for Room Events
    socket.on('peer-raised-hand', ({ socketId, name }) => {
      setRaisedHands(prev => ({ ...prev, [socketId]: true }));
      // Auto lower hand after 5 seconds
      setTimeout(() => {
        setRaisedHands(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }, 5000);
    });

    socket.on('force-mute', () => {
      if (localAudioEnabled) {
        setLocalAudioEnabled(toggleMedia('audio'));
      }
    });

    socket.on('force-removed', () => {
      handleLeave();
    });

    return () => {
      socket.off('peer-raised-hand');
      socket.off('force-mute');
      socket.off('force-removed');
      // Fix 1: Ensure absolute cleanup on unmount
      cleanup();
    };
  }, [roomId, navigate, startLocalStream, cleanup]);

  const handleToggleScreenShare = async (startSharing) => {
    try {
      if (startSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        replaceVideoTrack(screenTrack);
        screenTrack.onended = () => replaceVideoTrack(originalVideoTrack);
        return true;
      } else {
        replaceVideoTrack(originalVideoTrack);
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const handleLeave = () => {
    // Fix 1: Post-meeting cleanup
    cleanup();
    const durationSeconds = Math.floor((Date.now() - meetingStartTime.current) / 1000);
    // Fix 2: Navigate to post-meeting screen
    navigate('/post-meeting', { state: { roomId, duration: durationSeconds } });
  };

  const handleRaiseHand = () => {
    setRaisedHands(prev => ({ ...prev, [user.id]: true })); // Local optimisitc
    socket.emit('raise-hand', { roomId });
    setTimeout(() => {
      setRaisedHands(prev => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }, 5000);
  };

  const handleMuteAll = () => {
    socket.emit('mute-everyone', { roomId });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Meeting link copied!');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-heading text-xl">Entering Room...</div>;
  if (!isValidRoom) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 shadow-sm z-30 shrink-0">
        <div className="font-heading text-lg sm:text-xl text-primary font-semibold truncate">ConnectSphere</div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm font-mono tracking-widest text-textSecondary border border-border hidden md:block">
            {roomId}
          </div>
          <button onClick={() => setActiveTab('video')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded flex items-center gap-1 sm:gap-2 transition-colors ${activeTab === 'video' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
            <Grid size={16} /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button onClick={() => setActiveTab('whiteboard')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded flex items-center gap-1 sm:gap-2 transition-colors ${activeTab === 'whiteboard' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
            <Layout size={16} /> <span className="hidden sm:inline">Board</span>
          </button>
          <div className="w-px h-6 bg-border mx-1"></div>
          <button onClick={() => setRightPanel(rightPanel === 'chat' ? 'none' : 'chat')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded flex items-center gap-1 sm:gap-2 transition-colors ${rightPanel === 'chat' ? 'bg-secondary text-white' : 'hover:bg-gray-100'}`}>
            <MessageSquare size={16} /> <span className="hidden sm:inline">Chat</span>
          </button>
          <button onClick={() => setRightPanel(rightPanel === 'files' ? 'none' : 'files')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded flex items-center gap-1 sm:gap-2 transition-colors ${rightPanel === 'files' ? 'bg-secondary text-white' : 'hover:bg-gray-100'}`}>
            <FolderOpen size={16} /> <span className="hidden sm:inline">Files</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex">
        <div className="flex-1 relative bg-gray-900 flex flex-col min-w-0">
          {activeTab === 'video' ? (
            <VideoGrid 
              localStream={localStream} 
              localUser={user} 
              peers={peers} 
              localAudioEnabled={localAudioEnabled}
              localVideoEnabled={localVideoEnabled}
              raisedHands={raisedHands}
            />
          ) : (
            <Whiteboard socket={socket} roomId={roomId} />
          )}
        </div>
        
        {rightPanel === 'chat' && <ChatPanel socket={socket} roomId={roomId} />}
        {rightPanel === 'files' && <FileDropzone socket={socket} roomId={roomId} />}
      </main>

      <ControlBar 
        onToggleAudio={() => { const s = toggleMedia('audio'); setLocalAudioEnabled(s); return s; }}
        onToggleVideo={() => { const s = toggleMedia('video'); setLocalVideoEnabled(s); return s; }}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        onRaiseHand={handleRaiseHand}
        onMuteAll={handleMuteAll}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
};

export default Room;
