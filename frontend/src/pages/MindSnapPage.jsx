import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// MindSnap: memorize the color grid pattern, then reproduce it from memory

const COLORS = ['#ef4444', '#3b82f6', '#B6FF4D', '#f59e0b', '#8b5cf6', '#ec4899'];
const GRID_SIZE = 4; // 4×4 grid
const ACTIVE_COUNT = 6; // number of colored cells

const generatePattern = () => {
  const positions = [];
  while (positions.length < ACTIVE_COUNT) {
    const idx = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    if (!positions.some(p => p.idx === idx)) {
      positions.push({ idx, color: COLORS[positions.length % COLORS.length] });
    }
  }
  return positions;
};

const PHASES = {
  MEMORIZE: 'memorize',
  RECALL:   'recall',
  RESULT:   'result',
};

const MindSnapPage = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASES.MEMORIZE);
  const [pattern, setPattern] = useState(() => generatePattern());
  const [selected, setSelected] = useState(new Map()); // idx -> color
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [memorizeCountdown, setMemorizeCountdown] = useState(4);
  const [score, setScore] = useState(null);
  const [round, setRound] = useState(1);
  const timerRef = useRef(null);

  // Countdown during memorize phase
  useEffect(() => {
    if (phase !== PHASES.MEMORIZE) return;
    timerRef.current = setInterval(() => {
      setMemorizeCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setPhase(PHASES.RECALL);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, round]);

  const handleCellClick = (idx) => {
    if (phase !== PHASES.RECALL) return;
    const newSel = new Map(selected);
    if (newSel.has(idx)) {
      newSel.delete(idx);
    } else {
      newSel.set(idx, COLORS[activeColorIdx]);
    }
    setSelected(newSel);
  };

  const handleSubmit = () => {
    let correct = 0;
    pattern.forEach(({ idx, color }) => {
      if (selected.get(idx) === color) correct++;
    });
    setScore(correct);
    setPhase(PHASES.RESULT);
  };

  const handleNextRound = () => {
    const newPattern = generatePattern();
    setPattern(newPattern);
    setSelected(new Map());
    setMemorizeCountdown(4);
    setActiveColorIdx(0);
    setScore(null);
    setRound(r => r + 1);
    setPhase(PHASES.MEMORIZE);
  };

  const patternMap = new Map(pattern.map(p => [p.idx, p.color]));

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/play/daily')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
          ←
        </button>
        <div className="text-center">
          <div className="font-heading font-black text-lg text-white">MIND SNAP</div>
          <div className="text-xs text-muted">Round {round}</div>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-8">

        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {phase === PHASES.MEMORIZE && (
              <>
                <div className="text-xs text-muted tracking-widest uppercase mb-1">Memorize the pattern</div>
                <div className="font-heading font-black text-4xl text-blue-400">{memorizeCountdown}</div>
              </>
            )}
            {phase === PHASES.RECALL && (
              <div className="text-xs text-muted tracking-widest uppercase">Recreate the pattern from memory</div>
            )}
            {phase === PHASES.RESULT && (
              <div className={`font-heading font-black text-3xl ${score === ACTIVE_COUNT ? 'text-accent' : score >= ACTIVE_COUNT * 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>
                {score}/{ACTIVE_COUNT} Correct
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Grid */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            let bg = 'bg-white/5';
            let border = 'border-white/10';

            if (phase === PHASES.MEMORIZE && patternMap.has(idx)) {
              // Show the actual pattern
              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-14 h-14 rounded-xl border-2 border-white/20"
                  style={{ background: patternMap.get(idx) }}
                />
              );
            }

            if (phase === PHASES.RECALL) {
              const selColor = selected.get(idx);
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleCellClick(idx)}
                  className={`w-14 h-14 rounded-xl border-2 transition-all ${selColor ? 'border-white/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  style={selColor ? { background: selColor } : {}}
                />
              );
            }

            if (phase === PHASES.RESULT) {
              const patternColor = patternMap.get(idx);
              const selColor = selected.get(idx);
              const correct = patternColor && selColor === patternColor;
              const missed = patternColor && selColor !== patternColor;
              const wrong = !patternColor && selColor;

              return (
                <div
                  key={idx}
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${
                    correct ? 'border-accent' :
                    missed ? 'border-red-500/60 opacity-60' :
                    wrong ? 'border-red-500' :
                    'border-white/5 bg-transparent'
                  }`}
                  style={patternColor ? { background: patternColor + (correct ? '' : '66') } : selColor ? { background: selColor } : {}}
                >
                  {correct && <span className="text-black font-bold text-sm">✓</span>}
                  {wrong && <span className="text-white font-bold text-sm">✕</span>}
                </div>
              );
            }

            return <div key={idx} className={`w-14 h-14 rounded-xl border-2 ${bg} ${border}`} />;
          })}
        </div>

        {/* Color picker (recall phase) */}
        {phase === PHASES.RECALL && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-2 justify-center">
              {COLORS.map((color, i) => (
                <motion.button
                  key={color}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setActiveColorIdx(i)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${activeColorIdx === i ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: color }}
                />
              ))}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-heading font-bold text-base hover:bg-blue-400 transition-all"
            >
              SUBMIT
            </button>
          </motion.div>
        )}

        {/* Result actions */}
        {phase === PHASES.RESULT && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 w-full max-w-xs">
            <button onClick={handleNextRound}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-heading font-bold text-sm hover:bg-blue-400">
              NEXT ROUND
            </button>
            <button onClick={() => navigate('/play/daily')}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-muted font-heading font-bold text-sm hover:text-white">
              DONE
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default MindSnapPage;
