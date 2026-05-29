const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const whiteboardHandlers = require('./whiteboardHandlers');
const chatHandlers = require('./chatHandlers');
const Room = require('../models/Room');

module.exports = async (io) => {
  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));

  const connectedUsers = new Map();

  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || '');
      const token = cookies.token;
      if (!token) return next(new Error('Auth error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    connectedUsers.set(socket.userId, socket.id);

    socket.on('join-room', async ({ roomId, userProfile }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userProfile = userProfile;
      
      try {
        await Room.findOneAndUpdate({ roomId }, { $addToSet: { participants: socket.userId } });
      } catch(e) {}

      socket.to(roomId).emit('user-connected', { socketId: socket.id, userId: socket.userId, userProfile });

      const clients = io.sockets.adapter.rooms.get(roomId);
      const usersInRoom = [];
      if (clients) {
        clients.forEach((clientId) => {
          if (clientId !== socket.id) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket) {
              usersInRoom.push({ socketId: clientId, userId: clientSocket.userId, userProfile: clientSocket.userProfile });
            }
          }
        });
      }
      socket.emit('all-users', usersInRoom);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });

    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, userProfile: socket.userProfile });
    });

    socket.on('media-state-change', ({ roomId, type, isEnabled }) => {
      socket.to(roomId).emit('peer-media-state', { socketId: socket.id, type, isEnabled });
    });

    socket.on('raise-hand', ({ roomId }) => {
      io.to(roomId).emit('peer-raised-hand', { socketId: socket.id, name: socket.userProfile?.name });
    });

    socket.on('mute-everyone', ({ roomId }) => {
      socket.to(roomId).emit('force-mute');
    });

    socket.on('remove-participant', ({ socketId }) => {
      io.to(socketId).emit('force-removed');
    });

    socket.on('call-user', ({ userToCallId, callerProfile }) => {
      const targetSocketId = connectedUsers.get(userToCallId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming-call', { callerProfile, callerSocketId: socket.id });
      } else {
        socket.emit('call-failed', { reason: 'User offline' });
      }
    });

    socket.on('accept-call', ({ to, roomId }) => {
      io.to(to).emit('call-accepted', { roomId });
    });

    socket.on('decline-call', ({ to }) => {
      io.to(to).emit('call-declined');
    });

    socket.on('file-shared', ({ roomId, fileData }) => {
      socket.to(roomId).emit('file-shared', fileData);
    });

    whiteboardHandlers(io, socket, pubClient);
    chatHandlers(io, socket);

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.userId);
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-disconnected', socket.id);
      }
    });
  });
};
