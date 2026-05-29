const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, default: 'Meeting Room' },
  isActive: { type: Boolean, default: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  scheduledFor: { type: Date },
  password: { type: String },
  invitees: [{ type: String }] // emails of invited users
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
