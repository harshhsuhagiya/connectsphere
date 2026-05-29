const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getPresignedUrl, saveFileMetadata, getRoomFiles } = require('../controllers/fileController');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/presigned-url', getPresignedUrl);
router.post('/metadata', saveFileMetadata);
router.get('/', getRoomFiles);

module.exports = router;
