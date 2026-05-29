import { io } from 'socket.io-client';

const URL = window.location.origin.includes('3000') 
  ? 'http://localhost:5000' 
  : window.location.origin;

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: false // We will connect manually when user logs in
});
