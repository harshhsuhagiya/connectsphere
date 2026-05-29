const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, default: 'Whiteboard Draft' },
  imageUrl: { type: String, required: true }, // S3 url for the png
}, { timestamps: true });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
