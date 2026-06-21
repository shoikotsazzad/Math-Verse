import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import GlowButton from '../components/ui/GlowButton';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

const PracticePage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState('easy');

  useEffect(() => {
    loadQuestions();
  }, [difficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions', { params: { difficulty, limit: 10 } });
      setQuestions(res.data.questions || []);
      setCurrentIdx(0);
      setScore(0);
      setCorrect(0);
      setFinished(false);
      setAnswered(false);
    } catch {}
    finally { setLoading(false); }
  };

  const currentQ = questions[currentIdx];

  const handleAnswer = (answer) => {
    if (answered || !currentQ) return;
    setAnswered(true);
    const isCorrect = answer === currentQ.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
    }

    setTimeout(() => {
      setFeedback(null);
      setAnswered(false);
      setInput('');
      if (currentIdx + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 1200);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  if (!loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass p-12 text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">No questions found</h2>
          <p className="text-muted text-sm mb-6">No {difficulty} questions are available yet. Try a different difficulty or check back later.</p>
          <div className="flex gap-3 justify-center">
            {['easy','medium','hard'].filter(d => d !== difficulty).map(d => (
              <GlowButton key={d} variant="outline" onClick={() => setDifficulty(d)} className="capitalize text-sm py-2 px-4">{d}</GlowButton>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((correct / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass p-10 max-w-md w-full text-center"
        >
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-6">Practice Complete</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div>
              <div className="text-2xl font-heading font-bold text-accent">{score}</div>
              <div className="text-muted text-xs mt-1">Score</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-white">{correct}/{questions.length}</div>
              <div className="text-muted text-xs mt-1">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-white">{accuracy}%</div>
              <div className="text-muted text-xs mt-1">Accuracy</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <GlowButton onClick={loadQuestions}>Try Again</GlowButton>
            <GlowButton variant="outline" onClick={() => navigate('/play')}>Other Modes</GlowButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="glass border-0 border-b border-white/10 px-4 py-3">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm">Practice</span>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${difficulty === d ? 'bg-accent text-black' : 'bg-white/5 text-muted hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-accent font-heading font-bold">{score} pts</span>
            <span className="text-muted text-sm">{currentIdx + 1}/{questions.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        {!currentQ && !finished && (
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-3" />
            <p className="text-muted text-sm">Loading question…</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div
              key={currentQ._id + currentIdx}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className={`text-center text-3xl mb-6 font-heading font-bold ${feedback === 'correct' ? 'text-accent' : 'text-red-400'}`}
                >
                  {feedback === 'correct' ? '✓ Correct!' : `✗ The answer was ${currentQ.correctAnswer}`}
                </motion.div>
              )}

              <div className="text-center mb-10">
                <Badge color="gray" className="mb-4">{currentQ.difficulty}</Badge>
                <div className="text-4xl md:text-5xl font-heading font-bold text-white">
                  {currentQ.prompt}
                </div>
              </div>

              {currentQ.options?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {currentQ.options.map(opt => (
                    <motion.button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered}
                      whileHover={{ scale: answered ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                      className="glass p-5 text-center font-heading font-semibold text-lg hover:border-accent/50 hover:bg-accent/5 transition-all rounded-xl disabled:opacity-50"
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (input.trim()) handleAnswer(input.trim()); }} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={answered}
                    placeholder="Type your answer..."
                    className="input-field flex-1 text-xl text-center"
                    autoFocus
                  />
                  <GlowButton type="submit" disabled={answered || !input.trim()}>Submit</GlowButton>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PracticePage;
