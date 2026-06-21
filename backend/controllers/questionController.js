const Question = require('../models/Question');

const getQuestions = async (req, res, next) => {
  try {
    const { type, difficulty, limit = 10 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter).limit(parseInt(limit));
    res.json({ questions });
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { type, difficulty, prompt, options, correctAnswer } = req.body;
    const question = await Question.create({
      type, difficulty, prompt, options, correctAnswer, generatedBy: 'admin',
    });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
};

const getRandomQuestions = async (difficulty = 'medium', count = 10, types = null) => {
  const filter = { difficulty };
  if (types && types.length > 0) filter.type = { $in: types };
  return Question.aggregate([{ $match: filter }, { $sample: { size: count } }]);
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, getRandomQuestions };
