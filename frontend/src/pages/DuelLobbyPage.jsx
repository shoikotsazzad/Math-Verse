import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import useGameStore from '../store/gameStore';

const CATEGORY_META = {
  math:   { label: 'MATH',   color: '#facc15', textCls: 'text-yellow-400',  btnCls: 'bg-yellow-400 hover:bg-yellow-300 text-black', icon: '⚡' },
  memory: { label: 'MEMORY', color: '#60a5fa', textCls: 'text-blue-400',    btnCls: 'bg-blue-500 hover:bg-blue-400 text-white',     icon: '🧠' },
  puzzle: { label: 'PUZZLE', color: '#B6FF4D', textCls: 'text-[#B6FF4D]',   btnCls: 'bg-[#B6FF4D] hover:bg-[#c8ff6d] text-black',  icon: '🧩' },
  logic:  { label: 'LOGIC',  color: '#f472b6', textCls: 'text-pink-400',    btnCls: 'bg-pink-500 hover:bg-pink-400 text-white',     icon: '💡' },
};

const MODE_META = {
  sprint:          { name: 'SPRINT DUELS',      desc: 'Race to solve the most math questions in 60 seconds',        duration: '1 MIN', questions: '∞' },
  fast_first:      { name: 'FAST & FIRST DUELS', desc: 'Same question shown to both — first correct answer wins',   duration: '1 MIN', questions: 15 },
  ability:         { name: 'ABILITY DUELS',      desc: 'Speed meets full logic skillset — timed synchronized duel', duration: '2 MIN', questions: 10 },
  mind_snap:       { name: 'MIND SNAP DUELS',    desc: 'Memorize the color grid and reproduce it from memory',     duration: '1 MIN', questions: 8 },
  flash_anzan:     { name: 'FLASH ANZAN DUELS',  desc: 'Numbers flash on screen — sum them before they disappear', duration: '1 MIN', questions: 10 },
  puzzle_sprint:   { name: 'PUZZLE SPRINT',      desc: 'Solve the most puzzles in 2 minutes',                      duration: '2 MIN', questions: 10 },
  puzzle_mastery:  { name: 'PUZZLE MASTERY',     desc: 'Complete the hardest puzzle the fastest',                  duration: 'TIMED', questions: 5 },
  math_maze:       { name: 'MATH MAZE DUELS',    desc: 'Race through math mazes — first to solve all wins',        duration: '2 MIN', questions: 5 },
};

const ALL_MODES_FOR = {
  math:   ['sprint', 'fast_first'],
  memory: ['mind_snap', 'flash_anzan'],
  puzzle: ['puzzle_sprint', 'puzzle_mastery', 'math_maze'],
  logic:  ['ability'],
};

const RadarAnimation = ({ color }) => (
  <div className="relative flex items-center justify-center w-56 h-56 mx-auto">
    {[1, 2, 3].map(i => (
      <motion.div
        key={i}
        className="absolute rounded-full border border-white/10"
        style={{ width: `${i * 33}%`, height: `${i * 33}%` }}
        animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
      />
    ))}
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-gradient-to-r from-white/40 to-transparent origin-left" />
    </motion.div>
    <div className="relative z-10 w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center">
      <span className="font-heading font-black text-xl" style={{ color }}>MV</span>
    </div>
    <div className="absolute inset-0 opacity-8" style={{
      backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
      backgroundSize: '20% 20%',
    }} />
  </div>
);

const DuelLobbyPage = () => {
  const { category = 'math', mode = 'sprint' } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const resetGame = useGameStore(s => s.reset);

  const [searching, setSearching] = useState(false);
  const [showFriend, setShowFriend] = useState(false);
  const [friendStep, setFriendStep] = useState('idle'); // 'idle' | 'creating' | 'waiting' | 'joining'
  const [createdCode, setCreatedCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [roomError, setRoomError] = useState('');

  const cat  = CATEGORY_META[category] || CATEGORY_META.math;
  const meta = MODE_META[mode]          || MODE_META.sprint;
  const otherModes = (ALL_MODES_FOR[category] || []).filter(m => m !== mode);

  useEffect(() => {
    if (!socket) return;

    const onMatched = ({ roomId, roomCode, category: c, gameMode: gm }) => {
      setSearching(false);
      navigate(`/match/${roomId}`, { state: { roomCode, category: c, gameMode: gm } });
    };
    socket.on('queue:matched', onMatched);

    const onRoomCreated = ({ roomCode }) => {
      setCreatedCode(roomCode);
      setFriendStep('waiting');
    };
    socket.on('room:created', onRoomCreated);

    const onRoomJoined = ({ room }) => {
      if (room.status !== 'active') return;
      resetGame();
      navigate(`/match/${room._id}`, {
        state: { roomCode: room.roomCode, category: room.category || category, gameMode: room.gameMode || mode },
      });
    };
    socket.on('room:joined', onRoomJoined);

    const onRoomError = ({ message }) => {
      setRoomError(message);
      setFriendStep('idle');
      setJoinLoading(false);
    };
    socket.on('room:error', onRoomError);

    return () => {
      socket.off('queue:matched', onMatched);
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:error', onRoomError);
    };
  }, [socket, navigate, category, mode]);

  const handlePlayDuel = () => {
    if (!socket) return;
    resetGame();
    setSearching(true);
    socket.emit('queue:join', { mode: 'matchmaking', category, gameMode: mode });
  };

  const handleCancel = () => {
    socket?.emit('queue:leave');
    setSearching(false);
  };

  const handleCreateRoom = () => {
    if (!socket) return;
    setRoomError('');
    setFriendStep('creating');
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit('room:create', { roomCode: code, category, gameMode: mode });
    // Fallback: if no room:created within 6s, show error
    setTimeout(() => {
      setFriendStep(prev => prev === 'creating' ? 'idle' : prev);
      setRoomError(prev => prev || '');
    }, 6000);
  };

  const handleJoinRoom = () => {
    if (!socket || joinInput.length < 6) return;
    setRoomError('');
    setJoinLoading(true);
    socket.emit('room:join', { roomCode: joinInput.trim().toUpperCase() });
    setTimeout(() => setJoinLoading(false), 8000);
  };

  const resetFriend = () => {
    setShowFriend(false);
    setFriendStep('idle');
    setCreatedCode('');
    setJoinInput('');
    setRoomError('');
    setJoinLoading(false);
  };

  // Radar / searching screen
  if (searching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0B] px-4">
        <p className="text-xs text-muted tracking-[0.3em] uppercase mb-10">Searching for Opponent</p>
        <RadarAnimation color={cat.color} />
        <button
          onClick={handleCancel}
          className="mt-10 px-8 py-3 rounded-full bg-white/8 text-muted hover:text-white hover:bg-white/15 text-sm font-medium transition-all"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">

      {/* Top bar */}
      <div className="page-container pt-6 pb-0 flex items-center justify-between">
        <button
          onClick={() => navigate('/arena')}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
        >
          ←
        </button>
        <button className="px-4 py-2 rounded-full border border-white/15 text-xs text-muted hover:text-white transition-all">
          HOW TO PLAY?
        </button>
      </div>

      {/* Main two-column content */}
      <div className="page-container py-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-5xl">

          {/* ── Left: game info ── */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-xs font-bold tracking-widest ${cat.textCls}`}>{cat.label}</span>
              <span className="bg-white/8 text-white text-xs px-2.5 py-1 rounded-full font-medium">{meta.duration} DUEL</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-heading font-black text-white leading-tight mb-4">
              {meta.name}
            </h1>
            <p className="text-muted text-base leading-relaxed mb-8">{meta.desc}</p>

            {/* Stats strip */}
            <div className="flex gap-3 mb-10">
              {[
                { label: 'Questions', value: meta.questions },
                { label: 'Duration',  value: meta.duration },
                { label: 'Rating',    value: 'Ranked' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-center min-w-[72px]">
                  <div className="text-base font-heading font-bold text-white">{s.value}</div>
                  <div className="text-[10px] text-muted mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Other modes in this category */}
            {otherModes.length > 0 && (
              <div>
                <div className="text-xs text-muted tracking-widest uppercase mb-3">Other {cat.label} Modes</div>
                <div className="space-y-2">
                  {otherModes.map(m => (
                    <button
                      key={m}
                      onClick={() => navigate(`/play/duel/${category}/${m}`)}
                      className="w-full text-left flex items-center justify-between rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/20 px-4 py-3 transition-all group"
                    >
                      <span className="text-sm font-medium text-white">{MODE_META[m]?.name || m}</span>
                      <span className={`text-sm opacity-0 group-hover:opacity-100 transition-all ${cat.textCls}`}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: actions ── */}
          <div className="lg:pt-20">
            <AnimatePresence mode="wait">

              {/* Friend play panel */}
              {showFriend ? (
                <motion.div
                  key="friend"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  {/* Waiting state — show the code */}
                  {friendStep === 'waiting' ? (
                    <div className="space-y-5">
                      <div className="text-center space-y-4">
                        <div className="text-xs text-muted tracking-[0.2em] uppercase">Share this code with your friend</div>
                        <div className="glass rounded-2xl py-7 px-6 flex flex-col items-center gap-3">
                          <span className="font-heading font-black text-6xl tracking-[0.25em] text-white select-all">
                            {createdCode}
                          </span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(createdCode).catch(() => {})}
                            className="text-xs text-accent hover:text-accent/80 transition-colors"
                          >
                            Copy to clipboard
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="text-xs text-muted tracking-widest">Waiting for friend…</span>
                        </div>
                      </div>
                      <button
                        onClick={resetFriend}
                        className="w-full py-3 rounded-xl border border-white/10 text-muted text-sm hover:text-white hover:border-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    /* Create or join */
                    <div className="space-y-4">
                      <div className="font-heading font-bold text-white text-lg">Play with a Friend</div>

                      {roomError && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                          {roomError}
                        </div>
                      )}

                      {/* Create Room */}
                      <motion.button
                        onClick={handleCreateRoom}
                        disabled={friendStep === 'creating'}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 rounded-xl font-heading font-bold text-lg transition-all ${cat.btnCls} disabled:opacity-60`}
                      >
                        {friendStep === 'creating' ? 'Creating…' : 'CREATE ROOM'}
                      </motion.button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-muted">or join with a code</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      {/* Join Room */}
                      <div className="space-y-2">
                        <input
                          value={joinInput}
                          onChange={e => { setJoinInput(e.target.value.toUpperCase()); setRoomError(''); }}
                          placeholder="ENTER CODE"
                          maxLength={6}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white font-heading font-bold text-2xl text-center tracking-[0.3em] focus:outline-none focus:border-white/40 transition-colors"
                        />
                        <motion.button
                          onClick={handleJoinRoom}
                          disabled={joinInput.length < 6 || joinLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-xl font-heading font-bold text-lg bg-white/8 text-white border border-white/15 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {joinLoading ? 'Joining…' : 'JOIN ROOM'}
                        </motion.button>
                      </div>

                      <button
                        onClick={resetFriend}
                        className="w-full py-2 text-muted text-sm hover:text-white transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  )}
                </motion.div>

              ) : (
                /* Default: Play Duel + Play a Friend */
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-3"
                >
                  <motion.button
                    onClick={handlePlayDuel}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-5 rounded-xl font-heading font-bold text-xl tracking-widest transition-all shadow-lg ${cat.btnCls}`}
                  >
                    PLAY DUEL
                  </motion.button>
                  <button
                    onClick={() => setShowFriend(true)}
                    className="w-full py-4 text-muted hover:text-white text-sm font-medium tracking-widest transition-colors"
                  >
                    PLAY A FRIEND
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelLobbyPage;
