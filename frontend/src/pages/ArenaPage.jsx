import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';

const CATEGORIES = [
  { id: 'math',   label: 'MATH',   color: '#facc15', textCls: 'text-yellow-400', bgCls: 'bg-yellow-400/10', borderCls: 'border-yellow-400/50', icon: '⚡' },
  { id: 'memory', label: 'MEMORY', color: '#60a5fa', textCls: 'text-blue-400',   bgCls: 'bg-blue-400/10',   borderCls: 'border-blue-400/50',   icon: '🧠' },
  { id: 'puzzle', label: 'PUZZLE', color: '#B6FF4D', textCls: 'text-[#B6FF4D]',  bgCls: 'bg-[#B6FF4D]/10',  borderCls: 'border-[#B6FF4D]/50',  icon: '🧩' },
  { id: 'logic',  label: 'LOGIC',  color: '#f472b6', textCls: 'text-pink-400',   bgCls: 'bg-pink-400/10',   borderCls: 'border-pink-400/50',   icon: '💡' },
];

const DUEL_MODES = {
  math: [
    { id: 'sprint',     title: 'SPRINT DUELS',      subtitle: 'Race to solve the most in 1 minute',         duration: '1 MIN' },
    { id: 'fast_first', title: 'FAST & FIRST DUELS', subtitle: 'Same question — first correct answer wins',  duration: '1 MIN' },
  ],
  memory: [
    { id: 'mind_snap',   title: 'MIND SNAP DUELS',   subtitle: 'Memorize and reproduce the color grid', duration: '1 MIN' },
    { id: 'flash_anzan', title: 'FLASH ANZAN DUELS',  subtitle: 'Numbers flash — sum them with speed',  duration: '1 MIN' },
  ],
  puzzle: [
    { id: 'puzzle_sprint',   title: 'PUZZLE SPRINT',  subtitle: 'Solve the most puzzles in 2 minutes', duration: '2 MIN' },
    { id: 'puzzle_mastery',  title: 'PUZZLE MASTERY', subtitle: 'Complete the hardest puzzle fastest',  duration: 'TIMED' },
    { id: 'math_maze',       title: 'MATH MAZE DUELS', subtitle: 'Solve the maze to win',              duration: '2 MIN' },
  ],
  logic: [
    { id: 'ability', title: 'ABILITY DUELS', subtitle: 'Speed meets full logic skillset', duration: '2 MIN' },
  ],
};

const DAILY_PUZZLES = [
  {
    id: 'sudoku', title: 'Mini Sudoku', desc: '6×6 grid', route: '/play/sudoku', color: '#B6FF4D',
    preview: (
      <div className="grid grid-cols-6 gap-px w-14 h-14">
        {[1,3,5,2,4,6,4,6,2,5,3,1,2,1,4,3,6,5,6,5,3,1,2,4,3,4,1,6,5,2,5,2,6,4,1,3].map((n, i) => (
          <div key={i} className={`rounded-sm text-[5px] flex items-center justify-center font-bold ${i % 7 === 0 ? 'bg-[#B6FF4D]/40 text-black' : 'bg-white/10 text-white/50'}`}>{n}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'crossmath', title: 'Cross Math', desc: 'Fill + satisfy ops', route: '/play/crossmath', color: '#facc15',
    preview: (
      <div className="grid grid-cols-3 gap-1 w-14 h-14">
        {['?','+','?','×','','÷','?','-','?'].map((s, i) => (
          <div key={i} className={`rounded flex items-center justify-center text-[9px] font-bold ${['+ ','×','÷','-'].includes(s) ? 'text-yellow-400' : s ? 'bg-white/10 text-white/60' : ''}`}>{s}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'kenken', title: 'Ken Ken', desc: 'Cage arithmetic', route: '/play/kenken', color: '#a78bfa',
    preview: (
      <div className="relative w-14 h-14">
        <div className="grid grid-cols-4 gap-px w-full h-full">
          {[2,3,4,1,3,4,1,2,4,1,2,3,1,2,3,4].map((n, i) => (
            <div key={i} className="bg-white/8 rounded-sm flex items-center justify-center text-[6px] text-white/40 font-bold">{n}</div>
          ))}
        </div>
        {['6+','6×','3−','8+'].map((l, i) => (
          <div key={l} className="absolute text-[6px] font-bold text-purple-400" style={{ top: `${Math.floor(i/2)*50}%`, left: `${(i%2)*50}%`, padding: '1px' }}>{l}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'mathmaze', title: 'Math Maze', desc: 'Path to target', route: '/play/mathmaze', color: '#f472b6',
    preview: (
      <div className="grid grid-cols-4 gap-0.5 w-14 h-14">
        {[2,'→',3,'↓','+','','×','↓',4,'↓',1,'',null,'→',5,'★'].map((s, i) => (
          <div key={i} className={`rounded-sm flex items-center justify-center text-[7px] font-bold ${s === '★' ? 'bg-pink-500/40 text-pink-300' : s === null ? 'bg-white/3' : typeof s === 'number' ? 'bg-white/10 text-white/70' : 'text-[#B6FF4D]/70'}`}>{s ?? ''}</div>
        ))}
      </div>
    ),
  },
];

const ArenaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('math');
  const [recentUsers, setRecentUsers] = useState([]);
  const [dailyTab, setDailyTab] = useState('puzzles');

  useEffect(() => {
    api.get('/leaderboard/global?limit=8').then(res => {
      setRecentUsers(res.data?.leaderboard || []);
    }).catch(() => {});
  }, []);

  const categoryRating = {
    math:   user?.mathRating   || 1000,
    memory: user?.memoryRating || 1000,
    puzzle: user?.puzzleRating || 1000,
    logic:  user?.logicRating  || 1000,
  };

  const activeCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const modes = DUEL_MODES[activeCategory] || [];

  return (
    <div className="min-h-screen bg-[#0B0B0B]">

      {/* Live Activity Strip */}
      {recentUsers.length > 0 && (
        <div className="border-b border-white/5 bg-black/30">
          <div className="page-container py-2.5">
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-muted font-semibold tracking-widest uppercase">Live</span>
              </div>
              {recentUsers.slice(0, 8).map((u, i) => (
                <div key={u._id || i} className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Avatar username={u.username} src={u.avatarUrl} size="xs" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border border-black" />
                  </div>
                  <span className="text-[11px] text-muted hidden sm:block">{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="page-container py-8">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ─── LEFT: Duels (3/5) ─── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Section heading */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Duels</h2>
              <span className="text-xs text-muted tracking-widest">SELECT CATEGORY</span>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    whileTap={{ scale: 0.96 }}
                    className={`relative flex flex-col items-center gap-2 rounded-xl py-3 px-2 border-2 transition-all ${
                      isActive
                        ? `${cat.bgCls} ${cat.borderCls}`
                        : 'bg-white/3 border-white/8 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="text-center">
                      <div className={`text-[10px] font-bold tracking-wide ${isActive ? cat.textCls : 'text-muted'}`}>
                        {cat.label}
                      </div>
                      {isActive && (
                        <div className={`text-sm font-heading font-black ${cat.textCls}`}>
                          {categoryRating[cat.id]}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="cat-indicator"
                        className="absolute -bottom-px left-4 right-4 h-0.5 rounded-full"
                        style={{ background: cat.color }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Game Mode Cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {modes.map((mode, i) => (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/play/duel/${activeCategory}/${mode.id}`)}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20 px-6 py-5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className={`text-[10px] font-bold tracking-widest mb-1.5 ${activeCat.textCls}`}>
                          {activeCat.label} · {mode.duration} DUEL
                        </div>
                        <h3 className="text-xl md:text-2xl font-heading font-black text-white leading-tight">{mode.title}</h3>
                        <p className="text-xs text-muted mt-1 tracking-wide">{mode.subtitle}</p>
                      </div>
                      <div
                        className="shrink-0 ml-4 w-10 h-10 rounded-xl flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: activeCat.color + '22', color: activeCat.color }}
                      >
                        ▶
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Quest Banner */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-accent font-semibold tracking-widest uppercase">0/3 Completed</div>
                  <div className="font-heading font-bold text-white text-lg mt-0.5">Starter Quest</div>
                  <div className="text-xs text-muted">Win the reward in 3 games</div>
                </div>
                <div className="text-3xl">🎁</div>
              </div>
              <div className="relative flex items-center gap-2">
                <div className="absolute left-10 right-10 top-4 h-0.5 bg-white/10" />
                {['⚡ MATH', '🧠 MEMORY', '🧩 PUZZLE'].map((step, i) => (
                  <div key={step} className="relative flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-xs text-muted">
                      {step.split(' ')[0]}
                    </div>
                    <span className="text-[10px] text-muted mt-1.5">{step.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Daily Challenges (2/5) ─── */}
          <div className="lg:col-span-2 space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-white">Daily Challenges</h2>
              <Link to="/play/daily" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">
                View all →
              </Link>
            </div>

            {/* XP reward pill */}
            <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Complete all challenges today</div>
                <div className="text-white font-semibold text-sm mt-0.5">Daily Reward</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-2xl text-accent">+250</span>
                <span className="text-accent text-sm font-bold">XP ⚡</span>
              </div>
            </div>

            {/* Daily tab selector */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {[{ id: 'puzzles', label: 'Puzzles', count: '0/4' }, { id: 'maths', label: 'Maths', count: '0/2' }].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDailyTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    dailyTab === t.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    dailyTab === t.id ? 'bg-accent text-black' : 'bg-white/10 text-muted'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Puzzle cards 2×2 */}
            {dailyTab === 'puzzles' ? (
              <div className="grid grid-cols-2 gap-3">
                {DAILY_PUZZLES.map((puzzle, i) => (
                  <motion.button
                    key={puzzle.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(puzzle.route)}
                    className="relative rounded-2xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20 text-left overflow-hidden transition-all"
                  >
                    <div className="p-4">
                      <div className="flex justify-center mb-3">{puzzle.preview}</div>
                      <div className="font-heading font-bold text-sm text-white leading-tight">{puzzle.title}</div>
                      <div className="text-[10px] text-muted mt-0.5">{puzzle.desc}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: puzzle.color }} />
                        <span className="text-[10px] font-semibold" style={{ color: puzzle.color }}>DAILY</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { title: 'Arithmetic Blitz', desc: '10 quick arithmetic questions', icon: '⚡', color: '#facc15', route: '/play/daily/math' },
                  { title: 'Advanced Math',    desc: 'Harder problems, bigger XP',    icon: '🧮', color: '#f97316', route: '/play/practice' },
                ].map((item, i) => (
                  <motion.button
                    key={item.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.route)}
                    className="w-full glass rounded-xl p-4 text-left flex items-center gap-4 hover:border-white/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: item.color + '22' }}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-bold text-white text-sm">{item.title}</div>
                      <div className="text-[11px] text-muted mt-0.5">{item.desc}</div>
                    </div>
                    <div className="ml-auto text-muted shrink-0">→</div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Share Banner */}
            <div className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-heading font-bold text-white">Share the Challenge</div>
                <div className="text-xs text-muted mt-0.5">MathVerse is better with friends</div>
                <div className="text-accent text-xs font-bold mt-1">+50 Coins 🪙</div>
              </div>
              <button className="text-xs px-3 py-2 rounded-lg bg-accent text-black font-bold hover:bg-accent/90 transition-all">
                Invite
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaPage;
