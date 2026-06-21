import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 4×4 grid maze. Player starts at [0,0], goal is to reach [3,3] with running total = TARGET.
// Cells contain operators (+n / -n / ×n).
// Path must hit TARGET exactly.

const GRID = [
  [{ val: 2, op: 'start' }, { val: 3, op: '+' }, { val: 1, op: '-' }, { val: 4, op: '+' }],
  [{ val: 2, op: '×' },     { val: 5, op: '+' }, { val: 2, op: '+' }, { val: 1, op: '-' }],
  [{ val: 1, op: '+' },     { val: 2, op: '-' }, { val: 3, op: '×' }, { val: 2, op: '+' }],
  [{ val: 4, op: '+' },     { val: 1, op: '-' }, { val: 2, op: '+' }, { val: 0, op: 'goal' }],
];

const TARGET = 20;

const apply = (total, cell) => {
  if (cell.op === 'start') return cell.val;
  if (cell.op === '+') return total + cell.val;
  if (cell.op === '-') return total - cell.val;
  if (cell.op === '×') return total * cell.val;
  return total;
};

const MathMazePage = () => {
  const navigate = useNavigate();
  const [path, setPath] = useState([[0, 0]]);
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);

  const lastCell = path[path.length - 1];
  const runningTotal = path.reduce((acc, [r, c]) => apply(acc, GRID[r][c]), 0);
  const isInPath = (r, c) => path.some(([pr, pc]) => pr === r && pc === c);
  const isLast = (r, c) => lastCell[0] === r && lastCell[1] === c;

  const canMove = (r, c) => {
    const [lr, lc] = lastCell;
    const adjacent = (Math.abs(r - lr) === 1 && c === lc) || (r === lr && Math.abs(c - lc) === 1);
    return adjacent && !isInPath(r, c);
  };

  const handleCell = (r, c) => {
    if (!canMove(r, c) || complete || failed) return;
    const newPath = [...path, [r, c]];
    const newTotal = newPath.reduce((acc, [pr, pc]) => apply(acc, GRID[pr][pc]), 0);
    setPath(newPath);

    if (r === 3 && c === 3) {
      if (newTotal === TARGET) setComplete(true);
      else setFailed(true);
    }
  };

  const handleReset = () => {
    setPath([[0, 0]]);
    setComplete(false);
    setFailed(false);
  };

  const cellLabel = (r, c) => {
    const cell = GRID[r][c];
    if (cell.op === 'start') return String(cell.val);
    if (cell.op === 'goal') return '★';
    return `${cell.op}${cell.val}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/play/daily')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
          ←
        </button>
        <div className="text-center">
          <div className="font-heading font-black text-lg text-white">MATH MAZE</div>
          <div className="text-xs text-muted">Reach ★ with total = {TARGET}</div>
        </div>
        <button onClick={handleReset} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/10">
          ↺
        </button>
      </div>

      {/* Completion/Fail overlay */}
      <AnimatePresence>
        {(complete || failed) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="glass rounded-2xl p-8 w-full max-w-sm text-center">
              <div className="text-5xl mb-4">{complete ? '🏆' : '❌'}</div>
              <div className={`font-heading font-black text-3xl mb-2 ${complete ? 'text-pink-400' : 'text-red-400'}`}>
                {complete ? 'SOLVED!' : 'WRONG PATH'}
              </div>
              <div className="text-muted text-sm mb-6">
                {complete ? `You reached ${TARGET}!` : `Got ${runningTotal}, need ${TARGET}`}
              </div>
              <div className="flex gap-3">
                {!complete && (
                  <button onClick={handleReset}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white font-heading font-bold text-sm hover:bg-white/5">
                    TRY AGAIN
                  </button>
                )}
                <button onClick={() => navigate('/play/daily')}
                  className={`flex-1 py-3 rounded-xl font-heading font-bold text-sm ${complete ? 'bg-pink-500 text-white' : 'bg-white/10 text-muted'}`}>
                  DAILIES
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-8">
        {/* Running total */}
        <div className="flex items-center gap-4">
          <div className="glass rounded-xl px-5 py-2 text-center">
            <div className="text-xs text-muted">Current</div>
            <div className="font-heading font-black text-2xl text-white">{runningTotal}</div>
          </div>
          <div className="text-muted text-xl">→</div>
          <div className="glass rounded-xl px-5 py-2 text-center border border-pink-500/30">
            <div className="text-xs text-pink-400">Target</div>
            <div className="font-heading font-black text-2xl text-pink-400">{TARGET}</div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-2">
          {GRID.map((row, r) =>
            row.map((cell, c) => {
              const inP = isInPath(r, c);
              const last = isLast(r, c);
              const can = canMove(r, c);
              const isGoal = cell.op === 'goal';

              return (
                <motion.button
                  key={`${r}-${c}`}
                  whileTap={can ? { scale: 0.9 } : {}}
                  onClick={() => handleCell(r, c)}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center font-heading font-bold text-base transition-all border-2 ${
                    last ? 'border-white bg-white/20 text-white' :
                    inP ? 'border-pink-500/60 bg-pink-500/20 text-pink-300' :
                    isGoal ? 'border-pink-500/50 bg-pink-500/10 text-pink-400 text-2xl' :
                    can ? 'border-white/30 bg-white/8 text-white hover:border-white/50 cursor-pointer' :
                    'border-white/8 bg-white/3 text-white/30 cursor-default'
                  }`}
                >
                  {isGoal ? '★' : cellLabel(r, c)}
                </motion.button>
              );
            })
          )}
        </div>

        {/* Path display */}
        <div className="text-xs text-muted text-center">
          Steps: {path.length} · {path.length < 4 ? 'Keep going →' : 'Reach ★ with the right total'}
        </div>
      </div>
    </div>
  );
};

export default MathMazePage;
