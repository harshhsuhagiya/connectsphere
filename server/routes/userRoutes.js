const express = require('express');
const { updateProfile, updateNotifications, updateIntegrations, changePassword, deleteAccount, getMeetingHistory, getActiveSessions, revokeSession, getStats, getContacts, getRecentFiles, getWhiteboards } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.put('/profile', updateProfile);
router.patch('/me/notifications', updateNotifications);
router.patch('/me/integrations', updateIntegrations);
router.put('/password', changePassword);
router.delete('/me', deleteAccount);
router.get('/meetings', getMeetingHistory);
router.get('/me/sessions', getActiveSessions);
router.delete('/me/sessions/:sessionId', revokeSession);
router.get('/me/stats', getStats);
router.get('/me/contacts', getContacts);
router.get('/me/files', getRecentFiles);
router.get('/me/whiteboards', getWhiteboards);

module.exports = router;
