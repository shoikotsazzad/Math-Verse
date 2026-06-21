import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';

const PUZZLE_TYPES = [
  {
    id: 'sudoku',
    title: 'Mini Sudoku',
    desc: '6×6 grid — fill every row, column and box with logic',
    route: '/play/sudoku',
    color: '#B6FF4D',
    preview: (
      <div className="grid grid-cols-6 gap-px w-20 h-20 mx-auto">
        {[1,3,5,2,4,6,4,6,2,5,3,1,2,1,4,3,6,5,6,5,3,1,2,4,3,4,1,6,5,2,5,2,6,4,1,3].map((n, i) => (
          <div key={i} className={`rounded-sm text-[7px] flex items-center justify-center font-bold
            ${i % 7 === 0 ? 'bg-[#B6FF4D]/40 text-black' : 'bg-white/10 text-white/50'}`}>{n}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'crossmath',
    title: 'Cross Math',
    desc: 'Place numbers to satisfy every row and column operator',
    route: '/play/crossmath',
    color: '#facc15',
    preview: (
      <div className="grid grid-cols-3 gap-1.5 w-20 h-20 mx-auto">
        {['?','+','?','×','','÷','?','-','?'].map((s, i) => (
          <div key={i} className={`rounded flex items-center justify-center text-sm font-bold
            ${s === '+' || s === '-' || s === '×' || s === '÷' ? 'text-yellow-400' : s ? 'bg-white/10 text-white/70' : ''}`}>
            {s}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'kenken',
    title: 'Ken Ken',
    desc: 'Fill the cage grid — each cage must match its target',
    route: '/play/kenken',
    color: '#a78bfa',
    preview: (
      <div className="relative w-20 h-20 mx-auto">
        <div className="grid grid-cols-4 gap-px w-full h-full">
          {[2,3,4,1,3,4,1,2,4,1,2,3,1,2,3,4].map((n, i) => (
            <div key={i} className="bg-white/8 rounded-sm flex items-center justify-center text-[9px] text-white/40 font-bold">{n}</div>
          ))}
        </div>
        {['6+','6×','3−','8+'].map((label, i) => (
          <div key={label} className="absolute text-[8px] font-bold text-purple-400"
            style={{ top: `${Math.floor(i/2)*50}%`, left: `${(i%2)*50}%`, padding: '2px' }}>{label}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'mathmaze',
    title: 'Math Maze',
    desc: 'Trace a path through the grid — reach the target total',
    route: '/play/mathmaze',
    color: '#f472b6',
    preview: (
      <div className="grid grid-cols-4 gap-0.5 w-20 h-20 mx-auto">
        {[2,'→',3,'↓','+','','×','↓',4,'↓',1,'',null,'→',5,'★'].map((s, i) => (
          <div key={i} className={`rounded-sm flex items-center justify-center text-[9px] font-bold
            ${s === '★' ? 'bg-pink-500/40 text-pink-300' : s === null ? 'bg-white/3' : typeof s === 'number' ? 'bg-white/10 text-white/70' : 'text-[#B6FF4D]/70'}`}>
            {s ?? ''}
          </div>
        ))}
      </div>
    ),
  },
];

const MATH_DAILIES = [
  { id: 'arithmetic', title: 'Arithmetic Blitz',  desc: '10 timed arithmetic problems — aim for a perfect score', icon: '⚡', color: '#facc15', route: '/play/daily/math' },
  { id: 'advanced',   title: 'Advanced Math',      desc: 'Harder multi-step problems with bigger XP rewards',       icon: '🧮', color: '#f97316', route: '/play/practice' },
];

const DailyChallengePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('puzzles');
  const [dailyDone, setDailyDone] = useState({ puzzles: [], maths: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/daily-challenge')
      .then(res => {
        if (res.data.alreadyDone) setDailyDone(prev => ({ ...prev, maths: ['arithmetic'] }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const puzzleDoneCount = dailyDone.puzzles.length;
  const mathDoneCount   = dailyDone.maths.length;
  const allDone = puzzleDoneCount === 4 && mathDoneCount === 2;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <div className="page-container py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/arena')}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-black text-2xl text-white tracking-wide">Daily Challenges</h1>
            <p className="text-muted text-sm">New puzzles reset every midnight</p>
          </div>
          {/* Progress summary */}
          <div className={`shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
            allDone ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/10 bg-white/3 text-muted'
          }`}>
            {puzzleDoneCount + mathDoneCount} / 6 done
          </div>
        </div>

        {/* ── XP reward banner ── */}
        <div className={`rounded-xl border px-5 py-4 mb-6 flex items-center justify-between transition-all ${
          allDone ? 'border-accent/40 bg-accent/5' : 'border-white/10 bg-white/3'
        }`}>
          <div>
            <div className="text-xs text-muted tracking-widest uppercase mb-0.5">Daily Reward</div>
            <div className="text-white font-semibold">
              {allDone ? 'Reward claimed! See you tomorrow.' : 'Complete all 6 challenges to earn'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {allDone ? (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold text-xl">✓</div>
            ) : (
              <>
                <span className="font-heading font-black text-3xl text-accent">+250</span>
                <span className="text-accent font-bold">XP ⚡</span>
              </>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 max-w-xs">
          <button
            onClick={() => setTab('puzzles')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === 'puzzles' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
            }`}
          >
            Puzzles
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === 'puzzles' ? 'bg-accent text-black' : 'bg-white/10 text-muted'
            }`}>{puzzleDoneCount}/4</span>
          </button>
          <button
            onClick={() => setTab('maths')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === 'maths' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
            }`}
          >
            Maths
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === 'maths' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-muted'
            }`}>{mathDoneCount}/2</span>
          </button>
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'puzzles' ? (
              /* 4-column grid on desktop, 2 on tablet, 1 on mobile */
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PUZZLE_TYPES.map((puzzle, i) => {
                  const isDone = dailyDone.puzzles.includes(puzzle.id);
                  return (
                    <motion.button
                      key={puzzle.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(puzzle.route)}
                      className="relative rounded-2xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20 text-left overflow-hidden transition-all"
                    >
                      {isDone && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-black font-bold text-2xl">✓</div>
                        </div>
                      )}
                      <div className="p-5">
                        <div className="mb-4">{puzzle.preview}</div>
                        <div className="font-heading font-bold text-base text-white leading-tight">{puzzle.title}</div>
                        <div className="text-xs text-muted mt-1.5 leading-snug">{puzzle.desc}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: puzzle.color }} />
                          <span className="text-xs font-semibold" style={{ color: puzzle.color }}>DAILY PUZZLE</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Math dailies — 2-column on desktop */
              <div className="grid sm:grid-cols-2 gap-4">
                {MATH_DAILIES.map((item, i) => {
                  const isDone = dailyDone.maths.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !isDone && navigate(item.route)}
                      className={`rounded-2xl border border-white/10 p-6 text-left flex gap-5 transition-all ${
                        isDone ? 'bg-white/3 opacity-60' : 'bg-white/3 hover:bg-white/6 hover:border-white/20'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                        style={{ background: item.color + '22' }}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-white text-base">{item.title}</div>
                        <div className="text-sm text-muted mt-1 leading-snug">{item.desc}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs font-semibold" style={{ color: item.color }}>DAILY MATH</span>
                        </div>
                      </div>
                      {isDone ? (
                        <div className="ml-auto shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">✓</div>
                      ) : (
                        <div className="ml-auto shrink-0 text-muted self-center text-lg">→</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DailyChallengePage;
