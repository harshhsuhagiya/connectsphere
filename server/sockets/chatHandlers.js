const Message = require('../models/Message');

module.exports = (io, socket) => {
  socket.on('join-chat', async (roomId) => {
    try {
      // Send last 50 messages to the user
      const history = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name avatar');
      
      socket.emit('chat-history', history.reverse());
    } catch (err) {
      console.error('Error fetching chat history', err);
    }
  });

  socket.on('send-message', async ({ roomId, text }) => {
    try {
      const newMessage = await Message.create({
        roomId,
        sender: socket.userId,
        text
      });

      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');

      io.to(roomId).emit('receive-message', populatedMessage);
    } catch (err) {
      console.error('Error sending message', err);
    }
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('user-typing', { user: socket.userProfile.name, isTyping });
  });
};
