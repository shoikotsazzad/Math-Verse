import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// A simple 6×6 sudoku puzzle. 0 = empty cell.
const PUZZLE = [
  [0, 3, 0, 0, 6, 0],
  [1, 0, 0, 3, 0, 4],
  [0, 0, 3, 0, 0, 6],
  [6, 0, 0, 4, 0, 0],
  [3, 0, 5, 0, 0, 2],
  [0, 4, 0, 0, 5, 0],
];

const SOLUTION = [
  [4, 3, 1, 2, 6, 5],
  [1, 6, 2, 3, 5, 4],
  [5, 2, 3, 1, 4, 6],
  [6, 5, 4, 4, 1, 3],
  [3, 1, 5, 6, 4, 2],
  [2, 4, 6, 5, 3, 1],
];

// 6×6: boxes are 2 rows × 3 cols
const BOX_ROW = 2, BOX_COL = 3;

const MiniSudokuPage = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(() => PUZZLE.map(r => [...r]));
  const [selected, setSelected] = useState(null); // [row, col]
  const [errors, setErrors] = useState(new Set());
  const [complete, setComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(null);

  const isFixed = (r, c) => PUZZLE[r][c] !== 0;

  const isHighlighted = (r, c) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    const sameRow = r === sr;
    const sameCol = c === sc;
    const sameBox = Math.floor(r / BOX_ROW) === Math.floor(sr / BOX_ROW)
      && Math.floor(c / BOX_COL) === Math.floor(sc / BOX_COL);
    return sameRow || sameCol || sameBox;
  };

  const isSelected = (r, c) => selected && selected[0] === r && selected[1] === c;

  const checkComplete = useCallback((newBoard) => {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (newBoard[r][c] !== SOLUTION[r][c]) return false;
      }
    }
    return true;
  }, []);

  const handleInput = (num) => {
    if (!selected || complete) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Mark error if wrong
    const key = `${r},${c}`;
    const newErrors = new Set(errors);
    if (num !== 0 && newBoard[r][c] !== SOLUTION[r][c]) {
      newErrors.add(key);
    } else {
      newErrors.delete(key);
    }
    setErrors(newErrors);

    if (checkComplete(newBoard)) {
      setComplete(true);
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/play/daily')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
          ←
        </button>
        <div className="text-center">
          <div className="font-heading font-black text-lg text-white">MINI SUDOKU</div>
          <div className="text-xs text-muted">6 × 6 Grid</div>
        </div>
        <div className="w-9" />
      </div>

      {/* Completion screen */}
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass rounded-2xl p-8 w-full max-w-sm text-center"
            >
              <div className="text-5xl mb-4">🎉</div>
              <div className="font-heading font-black text-3xl text-accent mb-2">SOLVED!</div>
              <div className="text-muted text-sm mb-1">Completed in</div>
              <div className="text-white font-heading font-bold text-4xl mb-6">
                {elapsed !== null ? formatTime(elapsed) : '—'}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/play/daily')}
                  className="flex-1 py-3 rounded-xl bg-accent text-black font-heading font-bold text-sm"
                >
                  BACK TO DAILIES
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Grid */}
        <div className="mb-8">
          <div
            className="border-2 border-white/30 rounded-xl overflow-hidden"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.08)' }}
          >
            {board.map((row, r) =>
              row.map((val, c) => {
                const fixed = isFixed(r, c);
                const sel = isSelected(r, c);
                const high = isHighlighted(r, c);
                const errKey = `${r},${c}`;
                const hasError = errors.has(errKey);
                const showBorderRight = (c + 1) % BOX_COL === 0 && c < 5;
                const showBorderBottom = (r + 1) % BOX_ROW === 0 && r < 5;

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => !complete && setSelected([r, c])}
                    className={`relative flex items-center justify-center text-xl font-heading font-bold transition-all
                      ${sel ? 'bg-accent/30' : high ? 'bg-white/8' : 'bg-[#111]'}
                      ${showBorderRight ? 'border-r-2 border-r-white/30' : ''}
                      ${showBorderBottom ? 'border-b-2 border-b-white/30' : ''}
                    `}
                    style={{ width: 52, height: 52 }}
                  >
                    {val !== 0 && (
                      <span className={
                        hasError ? 'text-red-400' :
                        fixed ? 'text-white' :
                        'text-accent'
                      }>
                        {val}
                      </span>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleInput(n)}
              className="w-11 h-11 rounded-xl bg-white/8 border border-white/10 text-white font-heading font-bold text-lg hover:bg-white/15 transition-all"
            >
              {n}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleInput(0)}
            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-muted font-heading font-bold text-lg hover:bg-white/10 transition-all"
          >
            ✕
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MiniSudokuPage;
