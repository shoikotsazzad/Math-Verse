const express = require('express');
const router = express.Router();
const { getUsers, banUser, getAnalytics, getReports } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.get('/analytics', getAnalytics);
router.get('/reports', getReports);

module.exports = router;
