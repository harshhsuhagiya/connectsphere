const User = require('../models/User');
const Room = require('../models/Room');
const File = require('../models/File');
const Whiteboard = require('../models/Whiteboard');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redisClient');
const mongoose = require('mongoose');

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio, location, website, timezone, language, theme, accentColor, fontSize } = req.body;
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (timezone !== undefined) user.timezone = timezone;
    if (language !== undefined) user.language = language;
    if (theme !== undefined) user.theme = theme;
    if (accentColor !== undefined) user.accentColor = accentColor;
    if (fontSize !== undefined) user.fontSize = fontSize;

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const notifications = req.body;
    const user = await User.findById(req.user.id);
    user.notifications = { ...user.notifications, ...notifications };
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateIntegrations = async (req, res) => {
  try {
    const integrations = req.body;
    const user = await User.findById(req.user.id);
    user.integrations = { ...user.integrations, ...integrations };
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user.password && user.googleId) {
      return res.status(400).json({ success: false, message: 'OAuth users cannot change password' });
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // Delete all sessions
    if (redisClient.isReady) {
      const keys = await redisClient.keys(`session:${req.user.id}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
    await User.findByIdAndDelete(req.user.id);
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('sessionId', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = [];
    if (redisClient.isReady) {
      const keys = await redisClient.keys(`session:${req.user.id}:*`);
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }
    }
    // We can also fetch login history from a DB if we had it. For now, sessions act as history.
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (redisClient.isReady) {
      await redisClient.del(`session:${req.user.id}:${sessionId}`);
    }
    res.status(200).json({ success: true, message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const rooms = await Room.find({ participants: req.user.id, createdAt: { $gte: startOfMonth } });
    const totalMeetings = rooms.length;
    
    // Rough calculation of hours (assume each meeting is 1 hour for now if endedAt not precise, or calculate properly)
    let totalMs = 0;
    const uniquePeople = new Set();
    rooms.forEach(r => {
      if (r.startedAt && r.endedAt) {
        totalMs += (r.endedAt - r.startedAt);
      } else {
        totalMs += 1000 * 60 * 30; // Default 30 mins
      }
      r.participants.forEach(p => {
        if (p.toString() !== req.user.id) uniquePeople.add(p.toString());
      });
    });

    const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(1);

    // Get real files shared count
    const filesCount = await File.countDocuments({ roomId: { $in: rooms.map(r => r.roomId) } });

    res.status(200).json({
      success: true,
      stats: {
        totalMeetings,
        totalHours,
        filesShared: filesCount,
        peopleMet: uniquePeople.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMeetingHistory = async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('host', 'name avatar colorHash')
      .populate('participants', 'name avatar colorHash');
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id }).populate('participants', 'name avatar colorHash');
    const contactMap = {};
    rooms.forEach(room => {
      room.participants.forEach(p => {
        if (p._id.toString() !== req.user.id) {
          if (!contactMap[p._id]) contactMap[p._id] = { ...p.toObject(), meetings: 0 };
          contactMap[p._id].meetings += 1;
        }
      });
    });
    const contacts = Object.values(contactMap).sort((a, b) => b.meetings - a.meetings).slice(0, 6);
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentFiles = async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id }).select('roomId title');
    const roomIds = rooms.map(r => r.roomId);
    const files = await File.find({ roomId: { $in: roomIds } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('uploader', 'name');
    
    // Attach room title to files
    const fileData = files.map(f => {
      const room = rooms.find(r => r.roomId === f.roomId);
      return { ...f.toObject(), roomTitle: room ? room.title : 'Unknown Room' };
    });

    res.status(200).json({ success: true, files: fileData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWhiteboards = async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id }).select('roomId');
    const roomIds = rooms.map(r => r.roomId);
    const whiteboards = await Whiteboard.find({ roomId: { $in: roomIds } })
      .sort({ createdAt: -1 })
      .limit(8);
    res.status(200).json({ success: true, whiteboards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
