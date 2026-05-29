const express = require('express');
const { createRoom, getRoom, getActiveRooms, getUpcomingRooms } = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createRoom);
router.get('/active', getActiveRooms);
router.get('/upcoming', getUpcomingRooms);
router.get('/:roomId', getRoom);

module.exports = router;
