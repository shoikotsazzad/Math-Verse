import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import useGameStore from '../store/gameStore';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPRINT_TOTAL = 60;

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PlayerStrip = ({ player, correct, total, isMe, color }) => (
  <div className={`flex items-center gap-3 ${isMe ? '' : 'flex-row-reverse'}`}>
    <Avatar username={player?.username} src={player?.avatarUrl} size="sm" />
    <div className={`text-${isMe ? 'left' : 'right'}`}>
      <div className="text-[11px] text-white/50 truncate max-w-[90px]">{player?.username || 'You'}</div>
      <div className="font-heading font-black text-3xl leading-none" style={{ color }}>
        {correct}
      </div>
      {total > 0 && (
        <div className="text-[10px] text-white/30">{total} answered</div>
      )}
    </div>
  </div>
);

const GlobalTimerRing = ({ remaining, total }) => {
  const pct = remaining / total;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isRed = remaining <= 10;
  const color = isRed ? '#f43f5e' : '#14b8a6';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx="40" cy="40" r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          animate={{ stroke: color }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      <div
        className="absolute font-heading font-black text-2xl"
        style={{ color: isRed ? '#f43f5e' : 'white' }}
      >
        {remaining}
      </div>
    </div>
  );
};

const PerQuestionBar = ({ timeLeft, timeLimit, gameMode }) => {
  const pct = (timeLeft / timeLimit) * 100;
  const isRed = timeLeft <= 5;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="font-heading font-black text-4xl"
        style={{ color: isRed ? '#f43f5e' : 'white' }}
      >
        {timeLeft}s
      </div>
      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: isRed ? '#f43f5e' : '#14b8a6', width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </div>
      {gameMode === 'fast_first' && (
        <div className="text-[10px] text-white/30 tracking-widest">SAME QUESTION — FIRST CORRECT WINS</div>
      )}
    </div>
  );
};

const AnswerFeedbackOverlay = ({ feedback }) => {
  if (!feedback) return null;
  const isCorrect = feedback === 'correct';
  return (
    <motion.div
      key={feedback + Date.now()}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
      <div
        className="rounded-2xl px-8 py-5 font-heading font-black text-3xl"
        style={{
          background: isCorrect ? 'rgba(20,184,166,0.25)' : feedback === 'locked' ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.25)',
          border: `2px solid ${isCorrect ? '#14b8a6' : '#f43f5e'}`,
          color: isCorrect ? '#14b8a6' : '#f43f5e',
        }}
      >
        {isCorrect ? '✓ CORRECT!' : feedback === 'locked' ? '⚡ TOO SLOW' : '✗ WRONG'}
      </div>
    </motion.div>
  );
};

const QuestionDisplay = ({ question, feedback }) => (
  <div className="relative flex-1 flex items-center justify-center px-6 py-8 min-h-[200px]">
    <AnimatePresence>
      {feedback && <AnswerFeedbackOverlay feedback={feedback} />}
    </AnimatePresence>
    <AnimatePresence mode="wait">
      {question && (
        <motion.div
          key={question._id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="text-center w-full max-w-2xl"
        >
          <div className="text-5xl md:text-6xl font-heading font-black text-white leading-tight tracking-tight">
            {question.prompt}
          </div>
          {question.difficulty && (
            <div className="mt-3 text-[11px] text-white/20 tracking-widest uppercase">
              {question.type} · {question.difficulty}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const MultiChoiceGrid = ({ options, onAnswer, disabled, lastAnswer, correctAnswer }) => (
  <div className="grid grid-cols-2 gap-3 px-6 pb-6 w-full max-w-xl mx-auto">
    {options.map((opt) => {
      let borderColor = 'border-white/10';
      let bg = 'bg-white/4';
      if (disabled && lastAnswer !== undefined) {
        if (opt === correctAnswer) { borderColor = 'border-emerald-500/70'; bg = 'bg-emerald-500/15'; }
        else if (opt === lastAnswer) { borderColor = 'border-red-500/70'; bg = 'bg-red-500/15'; }
      }
      return (
        <motion.button
          key={opt}
          onClick={() => onAnswer(opt)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`py-4 rounded-xl font-heading font-semibold text-xl text-white border transition-all duration-150
            ${disabled ? 'cursor-default' : 'hover:border-white/30 hover:bg-white/8 cursor-pointer'}
            ${bg} ${borderColor}`}
        >
          {opt}
        </motion.button>
      );
    })}
  </div>
);

const OpenAnswerForm = ({ onSubmit, disabled, autoFocus }) => {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [disabled, autoFocus]);

  // Reset value when question changes (disabled transitions from true to false)
  useEffect(() => {
    if (!disabled) setVal('');
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (val.trim() && !disabled) { onSubmit(val.trim()); }
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-6 w-full max-w-xl mx-auto space-y-3">
      <div className="text-[11px] text-white/30 text-center tracking-widest uppercase">Type your answer</div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          disabled={disabled}
          placeholder="Enter answer…"
          className="flex-1 bg-white/6 border border-white/15 rounded-xl px-5 py-4 text-white text-2xl text-center font-heading font-bold focus:outline-none focus:border-white/40 transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={disabled || !val.trim()}
          className="px-6 py-4 rounded-xl bg-accent text-black font-heading font-black text-lg disabled:opacity-30 transition-all hover:bg-accent/90"
        >
          →
        </button>
      </div>
    </form>
  );
};

// ─── Results screen ───────────────────────────────────────────────────────────

const ResultsScreen = ({ results, user, opponent, gameMode, onRematch, onNewGame, onAnalysis, roomId }) => {
  const isWinner = results.winnerId?.toString() === user?._id?.toString();
  const isDraw = !results.winnerId;
  const myResult = results.myResult;
  const oppResult = results.opponentResult;

  const myScore = myResult?.score ?? 0;
  const oppScore = oppResult?.score ?? 0;
  const xpEarned = myResult?.xpEarned || 0;
  const ratingChange = myResult?.ratingChange || 0;
  const oppRatingChange = oppResult?.ratingChange || 0;

  const accentColor = isDraw ? '#a78bfa' : isWinner ? '#14b8a6' : '#f43f5e';
  const resultLabel = isDraw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEAT';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: isDraw
          ? 'linear-gradient(160deg,#1a1a2e 0%,#0B0B0B 55%)'
          : isWinner
            ? 'linear-gradient(160deg,#0d2d2a 0%,#0B0B0B 55%)'
            : 'linear-gradient(160deg,#2d0d1a 0%,#0B0B0B 55%)',
      }}
    >
      {/* Top bar */}
      <motion.div
        className="h-1.5 w-full shrink-0"
        style={{ background: accentColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full">

        {/* Result label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 text-center"
        >
          <div
            className="font-heading font-black tracking-widest"
            style={{ fontSize: 'clamp(3rem,12vw,5.5rem)', color: accentColor, lineHeight: 1 }}
          >
            {resultLabel}
          </div>
          <div className="text-white/30 text-xs tracking-widest mt-2 uppercase">
            {isDraw ? 'Equal match' : isWinner ? 'Well played!' : 'Better luck next time'}
          </div>
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 mb-4"
        >
          <div className="flex items-center">
            {/* Me */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar username={user?.username} src={user?.avatarUrl} size="md" />
              <div className="text-xs text-white/50 truncate max-w-[90px]">{user?.username}</div>
              <div
                className="font-heading font-black leading-none"
                style={{ fontSize: 'clamp(3rem,10vw,4.5rem)', color: isWinner || isDraw ? 'white' : 'rgba(255,255,255,0.4)' }}
              >
                {myScore}
              </div>
              <div className="text-xs font-semibold" style={{ color: accentColor }}>
                {ratingChange >= 0 ? '+' : ''}{ratingChange}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-2 px-4">
              <div className="text-white/20 text-xs font-bold tracking-widest">VS</div>
              <div className="h-16 w-px bg-white/10" />
              {gameMode === 'sprint' && (
                <div className="text-[10px] text-white/20 tracking-widest">CORRECT</div>
              )}
            </div>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar username={opponent?.username} size="md" />
              <div className="text-xs text-white/50 truncate max-w-[90px]">{opponent?.username || 'Opponent'}</div>
              <div
                className="font-heading font-black leading-none"
                style={{ fontSize: 'clamp(3rem,10vw,4.5rem)', color: !isWinner || isDraw ? 'white' : 'rgba(255,255,255,0.4)' }}
              >
                {oppScore}
              </div>
              <div className="text-xs text-white/30">
                {oppRatingChange >= 0 ? '+' : ''}{oppRatingChange}
              </div>
            </div>
          </div>

          {/* Show answered counts for sprint/fast_first */}
          {(gameMode === 'sprint' || gameMode === 'fast_first') && (
            <div className="mt-4 pt-4 border-t border-white/8 flex justify-between text-xs text-white/30">
              <span>{myResult?.totalAnswered || 0} answered</span>
              <span className="text-white/20">total attempts</span>
              <span>{oppResult?.totalAnswered || 0} answered</span>
            </div>
          )}
        </motion.div>

        {/* Rating + XP */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="w-full grid grid-cols-2 gap-3 mb-4"
        >
          <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
            <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Rating</div>
            <div className="font-heading font-black text-lg text-white">
              {(user?.rating || 1000) + ratingChange}
              <span className="text-sm ml-1" style={{ color: ratingChange >= 0 ? '#14b8a6' : '#f43f5e' }}>
                {ratingChange >= 0 ? '+' : ''}{ratingChange}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
            <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Total XP</div>
            <div className="font-heading font-black text-lg text-white">
              {user?.xp || 0}
              <span className="text-sm text-accent ml-1">+{xpEarned}</span>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        {myResult?.newAchievements?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full mb-4 space-y-2"
          >
            {myResult.newAchievements.map(a => (
              <div key={a._id} className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏅</span>
                  <span className="text-sm text-white font-medium">{a.title}</span>
                </div>
                <span className="text-accent text-[10px] font-bold tracking-widest">UNLOCKED</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="w-full space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRematch}
              className="py-4 rounded-xl font-heading font-black text-base tracking-widest border border-white/15 text-white hover:border-white/30 hover:bg-white/5 transition-all"
            >
              REMATCH
            </button>
            <button
              onClick={onNewGame}
              className="py-4 rounded-xl font-heading font-black text-base tracking-widest transition-all text-black"
              style={{ background: accentColor }}
            >
              NEW GAME
            </button>
          </div>

          <button
            onClick={onAnalysis}
            className="w-full py-3 rounded-xl border border-white/8 text-white/40 hover:text-white hover:border-white/20 text-sm font-medium tracking-widest transition-all"
          >
            ↓ VIEW GAME ANALYSIS
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Mind Snap Grid ───────────────────────────────────────────────────────────

const MindSnapGrid = ({ gridSize, phase, pattern, cellResults, onTap, boardNum, inputTimeLeft }) => {
  const total = gridSize * gridSize;
  const patternSet = new Set(pattern);
  const maxW = gridSize === 4 ? 320 : 380;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="h-8 flex items-center"
        >
          {phase === 'memorize' && (
            <div className="text-[11px] text-white/50 tracking-[0.3em] uppercase font-bold">
              Memorize the pattern
            </div>
          )}
          {phase === 'input' && (
            <div className="flex items-center gap-3">
              <div className="text-[11px] text-white/50 tracking-[0.3em] uppercase font-bold">Tap the pattern</div>
              <div
                className="font-heading font-black text-lg"
                style={{ color: inputTimeLeft <= 2 ? '#f43f5e' : '#14b8a6' }}
              >
                {inputTimeLeft}s
              </div>
            </div>
          )}
          {phase === 'feedback' && (
            <div className="text-[11px] text-white/50 tracking-[0.3em] uppercase font-bold">Result</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: maxW, maxWidth: '90vw' }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isPattern = patternSet.has(i);
          const result = cellResults[i]; // 'correct' | 'wrong' | undefined

          let bg = '#232323';
          let border = 'transparent';

          if (phase === 'memorize' && isPattern) {
            bg = '#0d9488'; // teal
          } else if (result === 'correct') {
            bg = '#0d9488'; // teal — correct tap
          } else if (result === 'wrong') {
            bg = '#e11d48'; // red — wrong tap
          } else if (phase === 'feedback' && isPattern && !result) {
            bg = '#15803d'; // green — missed tap
          }

          const canTap = phase === 'input' && !result;

          return (
            <motion.button
              key={i}
              onClick={() => canTap && onTap(boardNum, i)}
              disabled={!canTap}
              animate={{ backgroundColor: bg }}
              transition={{ duration: 0.12 }}
              className="rounded-xl"
              style={{
                aspectRatio: '1',
                backgroundColor: bg,
                border: `2px solid ${border}`,
                cursor: canTap ? 'pointer' : 'default',
              }}
              whileTap={canTap ? { scale: 0.88 } : {}}
            />
          );
        })}
      </div>

      {/* Legend during feedback */}
      {phase === 'feedback' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 text-[10px] text-white/40 tracking-widest"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#15803d' }} />
            MISSED
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#e11d48' }} />
            INCORRECT
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#0d9488' }} />
            CORRECT
          </span>
        </motion.div>
      )}
    </div>
  );
};

// ─── Main Match Page ──────────────────────────────────────────────────────────

const MatchPage = () => {
  const { roomId } = useParams();
  const { state: locState } = useLocation();
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    opponent, currentQuestion, currentIndex, myScore, opponentScore,
    myCorrect, opponentCorrect, myTotal, opponentTotal,
    status, countdown, results, globalTimeLeft, globalDuration,
    gameMode: storeGameMode, answerLog,
    setStatus, setCountdown, setQuestion, updateMyScore, updateOpponentScore,
    setResults, setGlobalTimer, addAnswerLog, setGameStartTime, setRoom, reset,
  } = useGameStore();

  const gameMode = storeGameMode || locState?.gameMode || 'ability';
  const isSprint = gameMode === 'sprint';
  const isFastFirst = gameMode === 'fast_first';
  const isMindSnap = gameMode === 'mind_snap';

  // Mind Snap specific state
  const [msPhase, setMsPhase] = useState('idle'); // 'idle'|'memorize'|'input'|'feedback'
  const [msPattern, setMsPattern] = useState([]);
  const [msGridSize, setMsGridSize] = useState(4);
  const [msBoardNum, setMsBoardNum] = useState(0);
  const [msCellResults, setMsCellResults] = useState({}); // cellIndex -> 'correct'|'wrong'
  const [msInputTimeLeft, setMsInputTimeLeft] = useState(5);
  const [msMyScore, setMsMyScore] = useState(0);
  const [msOppScore, setMsOppScore] = useState(0);
  const [msWarning, setMsWarning] = useState(null);
  const msInputTimerRef = useRef(null);
  const msBoardNumRef = useRef(0);

  const [timeLeft, setTimeLeft] = useState(15);
  const [answered, setAnswered] = useState(false);
  const [answerStart, setAnswerStart] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null); // 'correct' | 'wrong' | 'locked' | null
  const [lastAnswer, setLastAnswer] = useState(null);
  const [fastFirstStatus, setFastFirstStatus] = useState(null); // null | 'opp_wrong'
  const [showAnalysis, setShowAnalysis] = useState(false);

  const timerRef = useRef(null);
  const feedbackRef = useRef(null);
  const globalTimerRef = useRef(null);

  const clearFeedback = useCallback((delay = 600) => {
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    feedbackRef.current = setTimeout(() => setAnswerFeedback(null), delay);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackRef.current) clearTimeout(feedbackRef.current);
      if (msInputTimerRef.current) clearInterval(msInputTimerRef.current);
    };
  }, []);

  const handleMindSnapTap = useCallback((boardNum, cellIndex) => {
    if (!socket) return;
    socket.emit('game:mindSnapTap', { roomId, boardNum, cellIndex });
  }, [socket, roomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('game:countdown', ({ seconds }) => {
      setStatus('countdown');
      setCountdown(seconds);
    });

    socket.on('game:question', ({ question, index, timeLimit, gameMode: gm, total }) => {
      setStatus('playing');
      setQuestion(question, index, timeLimit || 15, total);
      setAnswered(false);
      setLastAnswer(null);
      setAnswerFeedback(null);
      setFastFirstStatus(null);
      setAnswerStart(Date.now());
      setTimeLeft(timeLimit || 15);

      if (!isSprint) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) { clearInterval(timerRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    });

    socket.on('game:globalTimer', ({ remaining, duration }) => {
      setGlobalTimer(remaining, duration);
    });

    socket.on('game:scoreUpdate', ({ playerId, score, isCorrect, totalAnswered }) => {
      const isMe = playerId?.toString() === user?._id?.toString();
      if (isMe) {
        updateMyScore(score, score, totalAnswered || 0);
      } else {
        updateOpponentScore(score, score, totalAnswered || 0);
      }
    });

    // Fast & First specific events
    socket.on('game:fastFirstCorrect', ({ playerId }) => {
      const isMe = playerId?.toString() === user?._id?.toString();
      if (!isMe) {
        // Opponent answered correctly — show locked state briefly
        setAnswerFeedback('locked');
        setAnswered(true);
        clearFeedback(700);
      }
    });

    socket.on('game:fastFirstWrong', ({ questionIndex }) => {
      // My wrong answer
      setAnswerFeedback('wrong');
      setAnswered(false); // Allow retry
      clearFeedback(600);
    });

    socket.on('game:fastFirstOpponentWrong', ({ playerId }) => {
      setFastFirstStatus('opp_wrong');
      setTimeout(() => setFastFirstStatus(null), 2000);
    });

    socket.on('game:opponentStatus', ({ status: s }) => {
      // Ability mode: opponent answered
    });

    socket.on('game:finished', ({ winnerId, finalScores, gameMode: gm }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const myFinal = finalScores.find(s => s.userId?.toString() === user?._id?.toString());
      const oppFinal = finalScores.find(s => s.userId?.toString() !== user?._id?.toString());
      setResults({ winnerId, myResult: myFinal, opponentResult: oppFinal, finalScores, gameMode: gm || gameMode });
    });

    socket.on('game:rematchAccept', ({ roomId: newRoomId, roomCode, gameMode: gm }) => {
      reset();
      navigate(`/match/${newRoomId}`, { state: { roomCode, gameMode: gm } });
    });

    socket.on('game:rematchRequest', ({ userId: uid }) => {
      socket.emit('game:rematchAccept', { roomId });
    });

    // ── Mind Snap events ─────────────────────────────────────────────────────
    socket.on('game:mindSnapPattern', ({ pattern, gridSize, boardNum }) => {
      if (msInputTimerRef.current) clearInterval(msInputTimerRef.current);
      msBoardNumRef.current = boardNum;
      setMsPhase('memorize');
      setMsPattern(pattern);
      setMsGridSize(gridSize);
      setMsBoardNum(boardNum);
      setMsCellResults({});
      setMsInputTimeLeft(5);
      setStatus('playing');
    });

    socket.on('game:mindSnapHide', ({ boardNum }) => {
      if (boardNum !== msBoardNumRef.current) return;
      setMsPhase('input');
      setMsInputTimeLeft(5);
      if (msInputTimerRef.current) clearInterval(msInputTimerRef.current);
      msInputTimerRef.current = setInterval(() => {
        setMsInputTimeLeft(prev => {
          if (prev <= 1) { clearInterval(msInputTimerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('game:mindSnapTapResult', ({ cellIndex, correct, boardNum }) => {
      if (boardNum !== msBoardNumRef.current) return;
      setMsCellResults(prev => ({ ...prev, [cellIndex]: correct ? 'correct' : 'wrong' }));
    });

    socket.on('game:mindSnapBoardEnd', ({ boardNum, pattern, myResult, opponentScore, opponentPoints }) => {
      if (msInputTimerRef.current) clearInterval(msInputTimerRef.current);
      setMsPhase('feedback');
      setMsMyScore(myResult.totalScore);
      setMsOppScore(opponentScore);
      // Show missed cells in green: set remaining pattern cells that aren't 'correct' as missed
      setMsCellResults(prev => {
        const updated = { ...prev };
        pattern.forEach(c => {
          if (!updated[c] || updated[c] !== 'correct') {
            updated[c] = 'missed';
          }
        });
        return updated;
      });
    });

    socket.on('game:mindSnapScore', ({ scores }) => {
      if (!user) return;
      const myId = user._id?.toString();
      Object.entries(scores).forEach(([uid, score]) => {
        if (uid === myId) setMsMyScore(score);
        else setMsOppScore(score);
      });
    });

    socket.on('game:mindSnapWarning', ({ message }) => {
      setMsWarning(message);
      setTimeout(() => setMsWarning(null), 4000);
    });

    return () => {
      socket.off('game:countdown');
      socket.off('game:question');
      socket.off('game:globalTimer');
      socket.off('game:scoreUpdate');
      socket.off('game:fastFirstCorrect');
      socket.off('game:fastFirstWrong');
      socket.off('game:fastFirstOpponentWrong');
      socket.off('game:opponentStatus');
      socket.off('game:finished');
      socket.off('game:rematchAccept');
      socket.off('game:rematchRequest');
      socket.off('game:mindSnapPattern');
      socket.off('game:mindSnapHide');
      socket.off('game:mindSnapTapResult');
      socket.off('game:mindSnapBoardEnd');
      socket.off('game:mindSnapScore');
      socket.off('game:mindSnapWarning');
    };
  }, [socket, user, gameMode]);

  const handleAnswer = useCallback((answer) => {
    if (!currentQuestion || !socket) return;
    if (answered && gameMode !== 'fast_first') return; // Sprint and Ability block re-answer
    if (answered && gameMode === 'fast_first' && answerFeedback === 'locked') return; // Locked

    const timeTaken = answerStart ? (Date.now() - answerStart) / 1000 : 0;
    const clampedTime = Math.min(timeTaken, 30);

    setAnswered(true);
    setLastAnswer(answer);

    socket.emit('game:answer', {
      roomId,
      questionId: currentQuestion._id,
      answer,
      timeTaken: clampedTime,
    });

    // Track locally for analysis
    addAnswerLog({
      questionIndex: currentIndex,
      timeTaken: clampedTime,
      questionType: currentQuestion.type,
      timestamp: Date.now(),
      answer,
    });

    // For Sprint: immediate feedback then allow next (server sends next question)
    if (isSprint) {
      // feedback shown briefly, then cleared (next question arrives from server)
      setAnswerFeedback(null); // will be set by scoreUpdate if needed
    }
  }, [currentQuestion, socket, answered, answerStart, gameMode, answerFeedback, roomId, currentIndex, addAnswerLog, isSprint]);

  // Update answer feedback based on score updates (for Sprint: brief flash)
  useEffect(() => {
    if (!socket) return;
    const onScore = ({ playerId, isCorrect }) => {
      if (playerId?.toString() === user?._id?.toString()) {
        setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
        clearFeedback(isSprint ? 400 : 700);
      }
    };
    socket.on('game:scoreUpdate', onScore);
    return () => socket.off('game:scoreUpdate', onScore);
  }, [socket, user, isSprint, clearFeedback]);

  const handleRematch = () => socket?.emit('game:rematchRequest', { roomId });

  // ── Idle / connecting ──────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-white/40 text-sm tracking-widest">Connecting to match…</p>
        </div>
      </div>
    );
  }

  // ── Countdown ──────────────────────────────────────────────────────────────
  if (status === 'countdown') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center">
        <div className="text-white/30 text-sm tracking-[0.3em] uppercase mb-8">
          {isSprint ? 'Sprint Duels' : isFastFirst ? 'Fast & First Duels' : isMindSnap ? 'Mind Snap Duels' : 'Ability Duels'}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="font-heading font-black text-accent"
            style={{ fontSize: 'clamp(6rem,20vw,10rem)' }}
          >
            {countdown > 0 ? countdown : 'GO!'}
          </motion.div>
        </AnimatePresence>
        {isSprint && (
          <div className="mt-8 text-white/20 text-xs tracking-widest">60 SECOND SPRINT</div>
        )}
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (status === 'finished' && results) {
    if (showAnalysis) {
      navigate(`/analysis/${roomId}`, {
        state: { results, gameMode, answerLog, opponent, isMindSnap },
      });
      return null;
    }

    return (
      <ResultsScreen
        results={results}
        user={user}
        opponent={opponent}
        gameMode={gameMode}
        onRematch={handleRematch}
        onNewGame={() => navigate('/arena')}
        onAnalysis={() => setShowAnalysis(true)}
        roomId={roomId}
      />
    );
  }

  // ── Mind Snap playing screen ───────────────────────────────────────────────
  if (isMindSnap && (status === 'playing' || msPhase !== 'idle')) {
    const myAccentColor = '#14b8a6';
    const oppColor = 'rgba(255,255,255,0.5)';

    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col select-none">
        {/* Header */}
        <div className="shrink-0 border-b border-white/8 px-4 pt-4 pb-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <PlayerStrip player={user} correct={msMyScore} total={0} isMe color={myAccentColor} />
            <div className="flex flex-col items-center gap-1 relative">
              <div className="relative flex items-center justify-center">
                <GlobalTimerRing remaining={globalTimeLeft} total={globalDuration || 60} />
                <div
                  className="absolute font-heading font-black text-2xl"
                  style={{ color: globalTimeLeft <= 10 ? '#f43f5e' : 'white' }}
                >
                  {globalTimeLeft}
                </div>
              </div>
              <div className="text-[10px] text-white/20 tracking-widest">
                {msGridSize === 5 ? '5×5 HARD' : '4×4'}
              </div>
            </div>
            <PlayerStrip player={opponent} correct={msOppScore} total={0} isMe={false} color={oppColor} />
          </div>
        </div>

        {/* Warning banner */}
        <AnimatePresence>
          {msWarning && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-500/15 border-b border-yellow-500/20 px-4 py-2 text-center text-yellow-400 text-xs tracking-widest"
            >
              ⚠ {msWarning}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          {msPhase === 'idle' ? (
            <Spinner size="lg" />
          ) : (
            <MindSnapGrid
              gridSize={msGridSize}
              phase={msPhase}
              pattern={msPattern}
              cellResults={msCellResults}
              onTap={handleMindSnapTap}
              boardNum={msBoardNum}
              inputTimeLeft={msInputTimeLeft}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  if (!currentQuestion && status !== 'playing') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Spinner size="lg" className="mx-auto" />
      </div>
    );
  }

  const myDisplayScore = isSprint || isFastFirst ? myCorrect : myScore;
  const oppDisplayScore = isSprint || isFastFirst ? opponentCorrect : opponentScore;
  const myAccentColor = '#14b8a6';
  const oppColor = 'rgba(255,255,255,0.5)';

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col select-none">

      {/* ── Header: players + timer ─────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/8 px-4 pt-4 pb-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

          <PlayerStrip
            player={user}
            correct={myDisplayScore}
            total={isSprint ? myTotal : 0}
            isMe
            color={myAccentColor}
          />

          {/* Center timer */}
          <div className="flex flex-col items-center gap-1 relative">
            {isSprint ? (
              <div className="relative flex items-center justify-center">
                <GlobalTimerRing remaining={globalTimeLeft} total={globalDuration || SPRINT_TOTAL} />
                <div
                  className="absolute font-heading font-black text-2xl"
                  style={{ color: globalTimeLeft <= 10 ? '#f43f5e' : 'white' }}
                >
                  {globalTimeLeft}
                </div>
              </div>
            ) : (
              <PerQuestionBar
                timeLeft={timeLeft}
                timeLimit={currentQuestion ? (isFastFirst ? 12 : 15) : 15}
                gameMode={gameMode}
              />
            )}
            {!isSprint && currentQuestion && (
              <div className="text-[10px] text-white/20 tracking-widest">
                Q {currentIndex + 1} {isFastFirst && '/ 15'}
              </div>
            )}
          </div>

          <PlayerStrip
            player={opponent}
            correct={oppDisplayScore}
            total={isSprint ? opponentTotal : 0}
            isMe={false}
            color={oppColor}
          />
        </div>

        {/* Fast & First status banner */}
        {isFastFirst && fastFirstStatus === 'opp_wrong' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-center text-[11px] text-yellow-400/80 tracking-widest"
          >
            ⚡ Opponent answered wrong — your turn!
          </motion.div>
        )}
      </div>

      {/* ── Question ────────────────────────────────────────────────────────── */}
      <QuestionDisplay question={currentQuestion} feedback={answerFeedback} />

      {/* ── Answer area ─────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        {currentQuestion && (
          currentQuestion.options?.length > 0 ? (
            <MultiChoiceGrid
              options={currentQuestion.options}
              onAnswer={handleAnswer}
              disabled={answered && gameMode !== 'fast_first'}
              lastAnswer={lastAnswer}
              correctAnswer={null}
            />
          ) : (
            <OpenAnswerForm
              onSubmit={handleAnswer}
              disabled={answered && gameMode !== 'fast_first'}
              autoFocus
            />
          )
        )}

        {/* Waiting message for Ability mode */}
        {answered && !isSprint && !isFastFirst && (
          <div className="text-center pb-6 text-white/25 text-xs tracking-widest">
            Waiting for next question…
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchPage;
