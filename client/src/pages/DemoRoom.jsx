import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoGrid from '../components/room/VideoGrid';
import ControlBar from '../components/room/ControlBar';
import ChatPanel from '../components/room/ChatPanel';
import { MessageSquare, Layout, Grid } from 'lucide-react';

const FAKE_USERS = [
  { id: '1', name: 'Priya Sharma', avatar: 'https://i.pravatar.cc/150?u=priya' },
  { id: '2', name: 'James Walker', avatar: '' }, // tests initial fallback
  { id: '3', name: 'Mei Chen', avatar: 'https://i.pravatar.cc/150?u=mei' },
  { id: '4', name: 'Carlos Rivera', avatar: 'https://i.pravatar.cc/150?u=carlos' },
];

const DemoRoom = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('video');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  
  const [raisedHands, setRaisedHands] = useState({});
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  
  // Fake Peers
  const peers = {
    'peer1': { userProfile: FAKE_USERS[0], isVideoEnabled: true, isAudioEnabled: true, stream: null },
    'peer2': { userProfile: FAKE_USERS[1], isVideoEnabled: false, isAudioEnabled: true, stream: null },
    'peer3': { userProfile: FAKE_USERS[2], isVideoEnabled: true, isAudioEnabled: false, stream: null },
    'peer4': { userProfile: FAKE_USERS[3], isVideoEnabled: true, isAudioEnabled: true, stream: null },
  };

  useEffect(() => {
    // Simulate active speakers every 3 seconds
    const interval = setInterval(() => {
      const keys = Object.keys(peers);
      const randomPeer = keys[Math.floor(Math.random() * keys.length)];
      setActiveSpeaker(randomPeer);
      
      // Randomly raise hand
      if (Math.random() > 0.8) {
        setRaisedHands(prev => ({ ...prev, [randomPeer]: true }));
        setTimeout(() => setRaisedHands(prev => { const n={...prev}; delete n[randomPeer]; return n; }), 4000);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Demo Banner */}
      <div className="bg-accent text-white text-center py-1 text-xs font-bold uppercase tracking-widest z-50 shadow-md">
        Interactive Demo Mode
      </div>
      
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shadow-sm z-30 shrink-0">
        <div className="font-heading text-xl text-primary font-semibold flex items-center gap-4">
          ConnectSphere
          <button onClick={() => navigate('/dashboard')} className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-opacity-90">Start Real Meeting</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('video')} className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 ${activeTab === 'video' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
            <Grid size={16} /> Grid
          </button>
          <div className="w-px h-6 bg-border mx-1"></div>
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 ${isChatOpen ? 'bg-secondary text-white' : 'hover:bg-gray-100'}`}>
            <MessageSquare size={16} /> Chat
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex">
        <div className="flex-1 relative bg-gray-900 flex flex-col min-w-0 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
             {/* Local Fake Tile */}
             <div className="relative rounded-lg overflow-hidden aspect-video shadow-md border-2 border-border bg-gray-800 flex items-center justify-center">
                {!localVideoEnabled ? (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-3xl text-white font-heading">Y</div>
                ) : (
                  <span className="text-textSecondary">Your Camera</span>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs">You (Demo)</div>
                {!localAudioEnabled && <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs">Muted</div>}
             </div>

             {/* Fake Peer Tiles */}
             {Object.entries(peers).map(([id, peer]) => (
                <div key={id} className={`relative rounded-lg overflow-hidden aspect-video shadow-md border-4 transition-colors ${activeSpeaker === id ? 'border-green-500' : raisedHands[id] ? 'border-accent' : 'border-gray-800'} bg-gray-800 flex items-center justify-center`}>
                  {!peer.isVideoEnabled ? (
                    peer.userProfile.avatar ? <img src={peer.userProfile.avatar} className="w-24 h-24 rounded-full" alt="" /> : <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-3xl text-white font-heading">{peer.userProfile.name.charAt(0)}</div>
                  ) : (
                    <img src={`https://source.unsplash.com/random/400x300?face&sig=${id}`} className="w-full h-full object-cover opacity-50" alt="Fake Video" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs">{peer.userProfile.name}</div>
                  {!peer.isAudioEnabled && <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs">Muted</div>}
                </div>
             ))}
          </div>
        </div>
        
        {isChatOpen && (
          <div className="w-80 bg-surface border-l border-border flex flex-col z-20">
            <div className="p-4 border-b border-border font-medium">Demo Chat</div>
            <div className="flex-1 p-4 space-y-4">
              <div className="bg-gray-100 p-2 rounded-lg text-sm rounded-tl-none">Hey everyone 👋</div>
              <div className="bg-gray-100 p-2 rounded-lg text-sm rounded-tl-none">Can you share your screen?</div>
              <div className="bg-primary text-white p-2 rounded-lg text-sm rounded-tr-none self-end ml-auto max-w-[80%]">Looks great!</div>
              <div className="bg-gray-100 p-2 rounded-lg text-sm rounded-tl-none">Let me pull up the designs.</div>
            </div>
          </div>
        )}
      </main>

      <ControlBar 
        onToggleAudio={() => { setLocalAudioEnabled(!localAudioEnabled); return !localAudioEnabled; }}
        onToggleVideo={() => { setLocalVideoEnabled(!localVideoEnabled); return !localVideoEnabled; }}
        onToggleScreenShare={async () => { alert("Screen share simulated in Demo mode!"); return true; }}
        onLeave={() => navigate('/dashboard')}
        onRaiseHand={() => alert("Hand raised!")}
        onMuteAll={() => alert("Muted everyone!")}
        onCopyLink={() => alert("Link copied!")}
      />
    </div>
  );
};

export default DemoRoom;
