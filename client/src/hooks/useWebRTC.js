import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const useWebRTC = (socket, roomId, userProfile) => {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (socket) socket.emit('join-room', { roomId, userProfile });
      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  }, [roomId, socket, userProfile]);

  const toggleMedia = (type) => {
    if (localStreamRef.current) {
      const track = type === 'video' 
        ? localStreamRef.current.getVideoTracks()[0] 
        : localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        socket.emit('media-state-change', { roomId, type, isEnabled: track.enabled });
        return track.enabled;
      }
    }
    return false;
  };

  const cleanup = useCallback(() => {
    // 1. Stop all hardware tracks immediately
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // 2. Destroy all peer connections
    Object.values(peersRef.current).forEach(peerObj => {
      if (peerObj && peerObj.peer) {
        peerObj.peer.close();
      }
    });
    peersRef.current = {};
    
    // 3. Clear state
    setPeers({});
    
    // 4. Leave socket room
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  }, [socket, roomId]);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('signal', { to: userToSignal, signal: { type: 'candidate', candidate: e.candidate } });
      }
    };

    peer.ontrack = (e) => {
      setPeers(prev => ({
        ...prev,
        [userToSignal]: { ...prev[userToSignal], stream: e.streams[0] }
      }));
    };

    peer.createOffer().then(offer => peer.setLocalDescription(offer)).then(() => {
      socket.emit('signal', { to: userToSignal, signal: peer.localDescription });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream, incomingUserProfile) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('signal', { to: callerId, signal: { type: 'candidate', candidate: e.candidate } });
      }
    };

    peer.ontrack = (e) => {
      setPeers(prev => ({
        ...prev,
        [callerId]: { stream: e.streams[0], userProfile: incomingUserProfile, isAudioEnabled: true, isVideoEnabled: true }
      }));
    };

    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(() => peer.createAnswer()).then(answer => peer.setLocalDescription(answer)).then(() => {
      socket.emit('signal', { to: callerId, signal: peer.localDescription });
    });

    return peer;
  };

  useEffect(() => {
    if (!socket) return;

    const handleAllUsers = (users) => {
      const stream = localStreamRef.current;
      if (!stream) return;
      users.forEach(user => {
        const peer = createPeer(user.socketId, socket.id, stream);
        peersRef.current[user.socketId] = { peer, userProfile: user.userProfile };
        setPeers(prev => ({
          ...prev,
          [user.socketId]: { userProfile: user.userProfile, peer, isAudioEnabled: true, isVideoEnabled: true }
        }));
      });
    };

    const handleSignal = async ({ from, signal, userProfile }) => {
      const stream = localStreamRef.current;
      if (!stream) return;

      if (signal.type === 'offer') {
        const peer = addPeer(signal, from, stream, userProfile);
        peersRef.current[from] = { peer, userProfile };
      } else if (signal.type === 'answer') {
        const peerObj = peersRef.current[from];
        if (peerObj && peerObj.peer) await peerObj.peer.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'candidate') {
        const peerObj = peersRef.current[from];
        if (peerObj && peerObj.peer) await peerObj.peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    const handleDisconnect = (socketId) => {
      if (peersRef.current[socketId]) {
        if (peersRef.current[socketId].peer) peersRef.current[socketId].peer.close();
        delete peersRef.current[socketId];
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[socketId];
          return newPeers;
        });
      }
    };

    const handleMediaState = ({ socketId, type, isEnabled }) => {
      setPeers(prev => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            [type === 'video' ? 'isVideoEnabled' : 'isAudioEnabled']: isEnabled
          }
        };
      });
    };

    socket.on('all-users', handleAllUsers);
    socket.on('signal', handleSignal);
    socket.on('user-disconnected', handleDisconnect);
    socket.on('peer-media-state', handleMediaState);

    return () => {
      socket.off('all-users', handleAllUsers);
      socket.off('signal', handleSignal);
      socket.off('user-disconnected', handleDisconnect);
      socket.off('peer-media-state', handleMediaState);
    };
  }, [socket]);

  const replaceVideoTrack = (newVideoTrack) => {
    Object.values(peersRef.current).forEach(peerObj => {
      if (peerObj && peerObj.peer) {
        const sender = peerObj.peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }
    });
  };

  return { localStream, startLocalStream, peers, toggleMedia, replaceVideoTrack, cleanup };
};
