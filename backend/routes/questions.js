const express = require('express');
const router = express.Router();
const { getQuestions, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getQuestions);
router.post('/', protect, adminOnly, createQuestion);
router.patch('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
