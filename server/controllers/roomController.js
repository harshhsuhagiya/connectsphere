const Room = require('../models/Room');
const crypto = require('crypto');

exports.createRoom = async (req, res) => {
  try {
    const roomId = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const { title, password, scheduledFor, invitees } = req.body;
    const newRoom = await Room.create({
      roomId,
      host: req.user.id,
      title: title || 'My Meeting Room',
      password: password || undefined,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      invitees: invitees || []
    });

    res.status(201).json({
      success: true,
      room: newRoom
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ success: false, message: 'Room is no longer active' });
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('host', 'name avatar colorHash')
      .populate('participants', 'name avatar colorHash')
      .sort({ startedAt: -1 })
      .limit(10);
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUpcomingRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 
      host: req.user.id, 
      scheduledFor: { $gt: new Date() } 
    }).sort({ scheduledFor: 1 });
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
