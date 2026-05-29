import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (url) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(url, {
      withCredentials: true,
      transports: ['websocket'],
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [url]);

  return socketRef.current;
};
