const express = require('express');
const router = express.Router();
const { getProfile, updateMe, getUserMatches } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:username', getProfile);
router.get('/:username/matches', getUserMatches);
router.patch('/me', protect, updateMe);

module.exports = router;
