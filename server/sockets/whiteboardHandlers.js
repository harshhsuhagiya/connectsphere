module.exports = (io, socket, pubClient) => {
  socket.on('request-canvas-state', async (roomId) => {
    try {
      const state = await pubClient.get(`canvas:${roomId}`);
      if (state) {
        socket.emit('canvas-state-from-server', JSON.parse(state));
      }
    } catch (err) {
      console.error('Error fetching canvas state', err);
    }
  });

  socket.on('canvas-update', async ({ roomId, data }) => {
    socket.to(roomId).emit('canvas-update', data);
    
    // Simplistic approach: we just store the last update.
    // In production, you'd apply the patch to the JSON tree.
    // Since Fabric JSON is complex, we might just rely on the frontend 
    // to occasionally send full state, but for this demo, we broadcast.
    // For full state sync, we should listen for 'canvas-save-state'
  });

  socket.on('canvas-save-full-state', async ({ roomId, state }) => {
    try {
      await pubClient.set(`canvas:${roomId}`, JSON.stringify(state));
    } catch (err) {
      console.error('Error saving full state', err);
    }
  });

  socket.on('canvas-clear', async (roomId) => {
    socket.to(roomId).emit('canvas-clear');
    try {
      await pubClient.del(`canvas:${roomId}`);
    } catch (err) {
      console.error('Error clearing canvas state', err);
    }
  });
};
