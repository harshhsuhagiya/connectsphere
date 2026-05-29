const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  s3Url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
