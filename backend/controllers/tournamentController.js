const Tournament = require('../models/Tournament');
const { generateBracket } = require('../services/bracketService');

const getTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find()
      .sort({ createdAt: -1 })
      .populate('participants', 'username avatarUrl rating')
      .populate('championId', 'username avatarUrl');
    res.json({ tournaments });
  } catch (err) {
    next(err);
  }
};

const getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants', 'username avatarUrl rating')
      .populate('championId', 'username avatarUrl')
      .populate('bracket.matches.player1', 'username avatarUrl')
      .populate('bracket.matches.player2', 'username avatarUrl')
      .populate('bracket.matches.winner', 'username avatarUrl');

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    res.json({ tournament });
  } catch (err) {
    next(err);
  }
};

const createTournament = async (req, res, next) => {
  try {
    const { name, startDate, maxParticipants, description, prizeXp } = req.body;
    const tournament = await Tournament.create({ name, startDate, maxParticipants, description, prizeXp });
    res.status(201).json({ tournament });
  } catch (err) {
    next(err);
  }
};

const registerForTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Registration is closed' });
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ message: 'Tournament is full' });
    }

    const alreadyIn = tournament.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (alreadyIn) return res.status(400).json({ message: 'Already registered' });

    tournament.participants.push(req.user._id);
    await tournament.save();
    res.json({ message: 'Registered successfully', tournament });
  } catch (err) {
    next(err);
  }
};

const startTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Cannot start tournament in current state' });
    }
    if (tournament.participants.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 participants' });
    }

    tournament.bracket = generateBracket(tournament.participants);
    tournament.status = 'active';
    await tournament.save();
    res.json({ tournament });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTournaments, getTournament, createTournament, registerForTournament, startTournament };
