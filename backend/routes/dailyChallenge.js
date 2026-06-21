const express = require('express');
const router = express.Router();
const { getDailyChallenge, submitDailyChallenge } = require('../controllers/dailyChallengeController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDailyChallenge);
router.post('/submit', protect, submitDailyChallenge);

module.exports = router;
