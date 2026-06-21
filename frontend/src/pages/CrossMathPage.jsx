import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Cross-math puzzle: a 3×3 grid with operators between cells
// Layout:  [A] + [B] = C
//           ×       ÷
//          [D] - [E] = F
//           =       =
//           G       H
//
// Values: A=3,B=4,D=6,E=2 → C=7, G=18, H=2, F=4

const PUZZLE_DEF = {
  cells: {
    A: { fixed: false, solution: 3 },
    B: { fixed: false, solution: 4 },
    C: { fixed: true,  solution: 7,  label: '7' },
    D: { fixed: false, solution: 6 },
    E: { fixed: false, solution: 2 },
    F: { fixed: true,  solution: 4,  label: '4' },
    G: { fixed: true,  solution: 18, label: '18' },
    H: { fixed: true,  solution: 2,  label: '2' },
  },
  hint: 'Fill A,B,D,E so each row/col equation holds',
};

const LAYOUT = [
  ['A', '+', 'B', '=', 'C'],
  ['×', ' ', '÷', ' ', ' '],
  ['D', '-', 'E', '=', 'F'],
  ['=', ' ', '=', ' ', ' '],
  ['G', ' ', 'H', ' ', ' '],
];

const CrossMathPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ A: '', B: '', D: '', E: '' });
  const [selected, setSelected] = useState(null);
  const [verified, setVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [complete, setComplete] = useState(false);

  const handlePad = (n) => {
    if (!selected || complete) return;
    const cur = values[selected] ?? '';
    if (n === 'del') {
      setValues(v => ({ ...v, [selected]: cur.slice(0, -1) }));
    } else {
      const next = cur + String(n);
      if (next.length <= 2) setValues(v => ({ ...v, [selected]: next }));
    }
  };

  const handleCheck = () => {
    const { A, B, D, E } = values;
    const a = parseInt(A), b = parseInt(B), d = parseInt(D), e = parseInt(E);
    const newErrors = {};
    if (a !== 3) newErrors.A = true;
    if (b !== 4) newErrors.B = true;
    if (d !== 6) newErrors.D = true;
    if (e !== 2) newErrors.E = true;
    setErrors(newErrors);
    setVerified(true);
    if (Object.keys(newErrors).length === 0) setComplete(true);
  };

  const getCell = (key) => {
    const cell = PUZZLE_DEF.cells[key];
    if (!cell) return null;
    if (cell.fixed) return cell.label;
    return values[key] ?? '';
  };

  const isOperator = (s) => ['+', '-', '×', '÷', '='].includes(s);
  const isKey = (s) => Object.keys(PUZZLE_DEF.cells).includes(s);
  const isEditable = (s) => isKey(s) && !PUZZLE_DEF.cells[s].fixed;

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/play/daily')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
          ←
        </button>
        <div className="text-center">
          <div className="font-heading font-black text-lg text-white">CROSS MATH</div>
          <div className="text-xs text-muted">Fill the grid so equations hold</div>
        </div>
        <div className="w-9" />
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {complete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="glass rounded-2xl p-8 w-full max-w-sm text-center">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-heading font-black text-3xl text-yellow-400 mb-4">CORRECT!</div>
              <button onClick={() => navigate('/play/daily')}
                className="w-full py-3 rounded-xl bg-yellow-400 text-black font-heading font-bold">
                BACK TO DAILIES
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-8">
        {/* Cross-math grid */}
        <div>
          {LAYOUT.map((row, ri) => (
            <div key={ri} className="flex items-center gap-2 mb-2">
              {row.map((cell, ci) => {
                if (cell === ' ') return <div key={ci} className="w-12 h-12" />;
                if (isOperator(cell)) {
                  return (
                    <div key={ci} className="w-8 text-center text-accent font-heading font-black text-xl">
                      {cell}
                    </div>
                  );
                }
                if (isEditable(cell)) {
                  const hasError = errors[cell];
                  const isSel = selected === cell;
                  return (
                    <motion.button
                      key={ci}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSelected(cell)}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-heading font-bold text-xl transition-all ${
                        isSel ? 'border-yellow-400 bg-yellow-400/15 text-yellow-400' :
                        hasError ? 'border-red-500/60 bg-red-500/10 text-red-400' :
                        verified && !hasError && values[cell] ? 'border-accent/50 bg-accent/10 text-accent' :
                        'border-white/20 bg-white/5 text-white'
                      }`}
                    >
                      {values[cell] || ''}
                    </motion.button>
                  );
                }
                // Fixed cell
                return (
                  <div key={ci} className="w-12 h-12 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center font-heading font-bold text-xl text-white/70">
                    {getCell(cell)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="text-muted text-xs text-center max-w-52">{PUZZLE_DEF.hint}</p>

        {/* Number pad */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <motion.button key={n} whileTap={{ scale: 0.9 }}
                onClick={() => handlePad(n)}
                className="w-14 h-12 rounded-xl bg-white/8 border border-white/10 text-white font-heading font-bold text-xl hover:bg-white/15 transition-all">
                {n}
              </motion.button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handlePad(0)}
              className="w-14 h-12 rounded-xl bg-white/8 border border-white/10 text-white font-heading font-bold text-xl hover:bg-white/15 transition-all">
              0
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handlePad('del')}
              className="w-14 h-12 rounded-xl bg-white/5 border border-white/10 text-muted font-heading font-bold text-xl hover:bg-white/10 transition-all">
              ⌫
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleCheck}
              className="w-14 h-12 rounded-xl bg-yellow-400 text-black font-heading font-bold text-sm hover:bg-yellow-300 transition-all">
              CHECK
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossMathPage;
