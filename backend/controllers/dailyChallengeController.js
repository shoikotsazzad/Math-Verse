const DailyChallenge = require('../models/DailyChallenge');
const { getRandomQuestions } = require('./questionController');

const todayStr = () => new Date().toISOString().split('T')[0];

const getDailyChallenge = async (req, res, next) => {
  try {
    const today = todayStr();
    let challenge = await DailyChallenge.findOne({ date: today }).populate('questions');

    if (!challenge) {
      const questions = await getRandomQuestions('medium', 10);
      challenge = await DailyChallenge.create({ date: today, questions: questions.map(q => q._id) });
      challenge = await DailyChallenge.findOne({ date: today }).populate('questions');
    }

    // Check if user already completed it
    const alreadyDone = req.user
      ? challenge.leaderboard.some(e => e.userId.toString() === req.user._id.toString())
      : false;

    res.json({ challenge, alreadyDone });
  } catch (err) {
    next(err);
  }
};

const submitDailyChallenge = async (req, res, next) => {
  try {
    const today = todayStr();
    const { answers } = req.body; // [{ questionId, answer }]
    const challenge = await DailyChallenge.findOne({ date: today }).populate('questions');

    if (!challenge) return res.status(404).json({ message: 'No challenge today' });

    const alreadyDone = challenge.leaderboard.some(
      e => e.userId.toString() === req.user._id.toString()
    );
    if (alreadyDone) return res.status(400).json({ message: 'Already completed today\'s challenge' });

    let correct = 0;
    const answerMap = {};
    (answers || []).forEach(a => { answerMap[a.questionId] = a.answer; });

    challenge.questions.forEach(q => {
      if (answerMap[q._id.toString()] === q.correctAnswer) correct++;
    });

    const score = correct * 10;
    const accuracy = Math.round((correct / challenge.questions.length) * 100);

    challenge.leaderboard.push({ userId: req.user._id, score, accuracy, completedAt: new Date() });
    await challenge.save();

    res.json({ score, correct, total: challenge.questions.length, accuracy });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDailyChallenge, submitDailyChallenge };
