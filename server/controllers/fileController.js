const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const File = require('../models/File');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

exports.getPresignedUrl = async (req, res) => {
  try {
    const { filename, fileType } = req.query;
    const { roomId } = req.params;

    const uniqueFilename = `${roomId}/${crypto.randomBytes(16).toString('hex')}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;

    res.status(200).json({ success: true, uploadUrl, s3Url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveFileMetadata = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { originalName, s3Url, mimeType, size } = req.body;

    const file = await File.create({
      roomId,
      uploader: req.user.id,
      originalName,
      s3Url,
      mimeType,
      size
    });

    const populatedFile = await File.findById(file._id).populate('uploader', 'name');

    res.status(201).json({ success: true, file: populatedFile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    const files = await File.find({ roomId }).populate('uploader', 'name');
    res.status(200).json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
