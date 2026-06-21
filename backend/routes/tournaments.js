const express = require('express');
const router = express.Router();
const {
  getTournaments, getTournament, createTournament, registerForTournament, startTournament
} = require('../controllers/tournamentController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.post('/', protect, adminOnly, createTournament);
router.post('/:id/register', protect, registerForTournament);
router.post('/:id/start', protect, adminOnly, startTournament);

module.exports = router;
