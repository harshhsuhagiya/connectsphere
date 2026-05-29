import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff, Hand } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const VideoPlayer = ({ stream, isLocal, profile, isVideoEnabled, isAudioEnabled, isRaisedHand }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative rounded-lg overflow-hidden aspect-video shadow-md border-2 transition-colors ${isRaisedHand ? 'border-accent' : 'border-border'}`}
    >
      {/* Video or Avatar Fallback */}
      {isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
          <UserAvatar name={profile?.name} src={profile?.avatar} size="xl" />
        </div>
      )}

      {/* Name Tag */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium z-10 flex items-center gap-2">
        {profile?.name || 'User'} {isLocal ? '(You)' : ''}
      </div>

      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        {!isAudioEnabled && (
          <div className="bg-red-500 text-white p-1.5 rounded-full shadow-md">
            <MicOff size={14} />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="bg-gray-700 text-white p-1.5 rounded-full shadow-md">
            <VideoOff size={14} />
          </div>
        )}
        {isRaisedHand && (
          <div className="bg-accent text-white p-1.5 rounded-full shadow-md animate-bounce">
            <Hand size={14} />
          </div>
        )}
      </div>

      {/* Muted Warning for Local */}
      {isLocal && !isAudioEnabled && (
        <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md z-10">
          You are muted
        </div>
      )}
    </motion.div>
  );
};

const VideoGrid = ({ localStream, localUser, peers, localVideoEnabled, localAudioEnabled, raisedHands }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 w-full h-full overflow-y-auto content-start bg-gray-900">
      {localStream && (
        <VideoPlayer 
          stream={localStream} 
          isLocal={true} 
          profile={localUser} 
          isVideoEnabled={localVideoEnabled}
          isAudioEnabled={localAudioEnabled}
          isRaisedHand={raisedHands?.[localUser?.id]}
        />
      )}
      {Object.entries(peers).map(([socketId, peerObj]) => {
        if (!peerObj.stream && peerObj.isVideoEnabled !== false) return null; // Wait for stream unless video explicitly off
        return (
          <VideoPlayer 
            key={socketId} 
            stream={peerObj.stream} 
            isLocal={false} 
            profile={peerObj.userProfile} 
            isVideoEnabled={peerObj.isVideoEnabled ?? true}
            isAudioEnabled={peerObj.isAudioEnabled ?? true}
            isRaisedHand={raisedHands?.[socketId]}
          />
        );
      })}
    </div>
  );
};

export default VideoGrid;
