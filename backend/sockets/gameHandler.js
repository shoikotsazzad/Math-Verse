const GameRoom = require('../models/GameRoom');
const Question = require('../models/Question');
const { getRandomQuestions } = require('../controllers/questionController');
const { processMatchEnd } = require('../services/xpService');
const { addToQueue, removeFromQueue, findMatch, generateRoomCode } = require('../services/matchmakingService');
const { generateQuestions } = require('../utils/questionGenerator');

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTDOWN_SECONDS = 3;

const MODE_CFG = {
  sprint: {
    duration: 60,   // total game seconds
    qTimeout: 6,    // per-question auto-advance seconds
    qPool: 50,      // questions pre-generated
  },
  fast_first: {
    qCount: 15,     // fixed questions
    qTimeout: 12,   // per-question timeout
  },
  ability: {
    qCount: 10,
    qTimeout: 15,
  },
  mind_snap: { qCount: 8, qTimeout: 20 },
  flash_anzan: { qCount: 10, qTimeout: 10 },
  puzzle_sprint: { qCount: 10, qTimeout: 30 },
  puzzle_mastery: { qCount: 5, qTimeout: 60 },
  math_maze: { qCount: 5, qTimeout: 60 },
};

// roomId -> room state
const activeRooms = new Map();

// ─── Countdown ────────────────────────────────────────────────────────────────
const startCountdown = (io, room, onDone) => {
  let seconds = COUNTDOWN_SECONDS;
  const interval = setInterval(() => {
    io.to(room.roomCode).emit('game:countdown', { seconds });
    seconds--;
    if (seconds < 0) {
      clearInterval(interval);
      onDone();
    }
  }, 1000);
};

// ─── End Game ─────────────────────────────────────────────────────────────────
const endGame = async (io, room) => {
  const freshRoom = await GameRoom.findById(room._id);
  if (!freshRoom || freshRoom.status === 'finished') return;

  const state = activeRooms.get(room._id.toString());

  // Clear all timers
  if (state) {
    if (state.gameTimer) clearTimeout(state.gameTimer);
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.questionTimer) clearTimeout(state.questionTimer);
    if (state.timer) clearTimeout(state.timer);
    for (const ps of Object.values(state.players || {})) {
      if (ps && ps.questionTimer) clearTimeout(ps.questionTimer);
    }
  }

  // Determine winner: correctCount first, then answeredCount as tiebreak
  const sorted = [...freshRoom.players].sort((a, b) => {
    const cA = a.correctCount || a.score || 0;
    const cB = b.correctCount || b.score || 0;
    if (cB !== cA) return cB - cA;
    return (b.answeredCount || 0) - (a.answeredCount || 0);
  });

  if (sorted.length >= 2) {
    const cA = sorted[0].correctCount || sorted[0].score || 0;
    const cB = sorted[1].correctCount || sorted[1].score || 0;
    const anA = sorted[0].answeredCount || 0;
    const anB = sorted[1].answeredCount || 0;
    if (cA !== cB || anA !== anB) {
      freshRoom.winnerId = sorted[0].userId;
    }
  }

  freshRoom.status = 'finished';
  freshRoom.endedAt = new Date();
  await freshRoom.save();

  let xpResults = [];
  try { xpResults = await processMatchEnd(freshRoom); } catch (e) { console.error('XP error:', e.message); }

  const finalScores = freshRoom.players.map(p => {
    const uid = p.userId.toString();
    const xpData = xpResults.find(r => r.userId.toString() === uid);

    // Gather answer history from state
    let answerHistory = [];
    if (state) {
      if (state.players && state.players[uid]) {
        answerHistory = state.players[uid].answerHistory || [];
      } else if (state.answerHistory && state.answerHistory[uid]) {
        answerHistory = state.answerHistory[uid];
      }
    }

    return {
      userId: p.userId,
      score: p.correctCount || p.score || 0,
      correctCount: p.correctCount || 0,
      totalAnswered: p.answeredCount || 0,
      accuracy: p.accuracy || 0,
      xpEarned: xpData?.xpEarned || 0,
      ratingChange: xpData?.ratingDelta || 0,
      newAchievements: xpData?.newAchievements || [],
      answerHistory,
    };
  });

  io.to(freshRoom.roomCode).emit('game:finished', {
    winnerId: freshRoom.winnerId,
    finalScores,
    gameMode: freshRoom.gameMode,
  });

  activeRooms.delete(room._id.toString());
};

// ─── SPRINT MODE ──────────────────────────────────────────────────────────────
const startSprintGame = async (io, room) => {
  const cfg = MODE_CFG.sprint;
  const questions = generateQuestions(cfg.qPool, 'mixed');

  const state = {
    gameMode: 'sprint',
    questions,
    startTime: Date.now(),
    players: {},
    gameTimer: null,
    timerInterval: null,
  };

  for (const p of room.players) {
    state.players[p.userId.toString()] = {
      socketId: null,
      questionIndex: 0,
      correctCount: 0,
      totalCount: 0,
      questionTimer: null,
      answerHistory: [],
    };
  }

  // 60-second hard stop
  state.gameTimer = setTimeout(() => endGame(io, room), cfg.duration * 1000);

  // Broadcast global timer each second
  let remaining = cfg.duration;
  io.to(room.roomCode).emit('game:globalTimer', { remaining, duration: cfg.duration });
  state.timerInterval = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    io.to(room.roomCode).emit('game:globalTimer', { remaining, duration: cfg.duration });
  }, 1000);

  activeRooms.set(room._id.toString(), state);

  // Send first question to each player individually
  const roomSockets = await io.in(room.roomCode).fetchSockets();
  for (const s of roomSockets) {
    const uid = s.user?._id?.toString();
    if (uid && state.players[uid]) {
      state.players[uid].socketId = s.id;
      sendSprintQuestion(io, s, room, uid, 0, state);
    }
  }
};

const sendSprintQuestion = (io, socket, room, userId, index, state) => {
  const ps = state.players[userId];
  if (!ps || index >= state.questions.length) return;

  const q = state.questions[index];
  ps.questionIndex = index;
  if (ps.questionTimer) clearTimeout(ps.questionTimer);

  socket.emit('game:question', {
    question: { _id: q._id, prompt: q.prompt, options: q.options, type: q.type, difficulty: q.difficulty },
    index,
    timeLimit: MODE_CFG.sprint.qTimeout,
    gameMode: 'sprint',
  });

  // Auto-advance after per-question timeout
  ps.questionTimer = setTimeout(() => {
    ps.totalCount++;
    ps.answerHistory.push({
      questionIndex: index, isCorrect: false,
      timeTaken: MODE_CFG.sprint.qTimeout, questionType: q.type,
      timestamp: Date.now() - state.startTime,
    });
    activeRooms.set(room._id.toString(), state);

    const playerSocket = io.sockets.sockets.get(ps.socketId);
    if (playerSocket) sendSprintQuestion(io, playerSocket, room, userId, index + 1, state);
  }, (MODE_CFG.sprint.qTimeout + 1) * 1000);

  activeRooms.set(room._id.toString(), state);
};

// ─── FAST & FIRST MODE ────────────────────────────────────────────────────────
const startFastFirstGame = async (io, room) => {
  const cfg = MODE_CFG.fast_first;
  const questions = await getRandomQuestions('medium', cfg.qCount,
    ['addition', 'subtraction', 'multiplication', 'division', 'percentage']);

  const state = {
    gameMode: 'fast_first',
    questions,
    currentQuestionIndex: 0,
    questionAnswered: false, // true once someone answers correctly on this question
    questionTimer: null,
    answerHistory: {},
  };

  for (const p of room.players) {
    state.answerHistory[p.userId.toString()] = [];
  }

  activeRooms.set(room._id.toString(), state);
  sendFastFirstQuestion(io, room, 0, state);
};

const sendFastFirstQuestion = (io, room, index, state) => {
  if (index >= state.questions.length) return endGame(io, room);

  const q = state.questions[index];
  state.currentQuestionIndex = index;
  state.questionAnswered = false;

  if (state.questionTimer) clearTimeout(state.questionTimer);

  io.to(room.roomCode).emit('game:question', {
    question: { _id: q._id, prompt: q.prompt, options: q.options, type: q.type, difficulty: q.difficulty },
    index,
    total: state.questions.length,
    timeLimit: MODE_CFG.fast_first.qTimeout,
    gameMode: 'fast_first',
  });

  // Timeout: no one answered correctly → advance
  state.questionTimer = setTimeout(() => {
    state.questionAnswered = false;
    activeRooms.set(room._id.toString(), state);
    sendFastFirstQuestion(io, room, index + 1, state);
  }, (MODE_CFG.fast_first.qTimeout + 1) * 1000);

  activeRooms.set(room._id.toString(), state);
};

// ─── ABILITY MODE (synchronized) ─────────────────────────────────────────────
const startAbilityGame = async (io, room) => {
  const qTypes = room.category === 'logic'
    ? ['logic', 'sequence', 'pattern']
    : ['addition', 'subtraction', 'multiplication', 'division', 'percentage', 'sequence'];

  const cfg = MODE_CFG[room.gameMode] || MODE_CFG.ability;
  const questions = await getRandomQuestions('medium', cfg.qCount, qTypes);

  const state = {
    gameMode: room.gameMode || 'ability',
    questions,
    currentQuestionIndex: 0,
    answers: {},
    timer: null,
    answerHistory: {},
  };

  for (const p of room.players) {
    state.answerHistory[p.userId.toString()] = [];
  }

  activeRooms.set(room._id.toString(), state);
  sendAbilityQuestion(io, room, 0, state);
};

const sendAbilityQuestion = (io, room, index, state) => {
  if (index >= state.questions.length) return endGame(io, room);

  const q = state.questions[index];
  state.currentQuestionIndex = index;
  state.answers = {};

  if (state.timer) clearTimeout(state.timer);

  const cfg = MODE_CFG[state.gameMode] || MODE_CFG.ability;

  io.to(room.roomCode).emit('game:question', {
    question: { _id: q._id, prompt: q.prompt, options: q.options, type: q.type, difficulty: q.difficulty },
    index,
    total: state.questions.length,
    timeLimit: cfg.qTimeout,
    gameMode: state.gameMode,
  });

  state.timer = setTimeout(() => {
    state.answers = {};
    activeRooms.set(room._id.toString(), state);
    sendAbilityQuestion(io, room, index + 1, state);
  }, (cfg.qTimeout + 1) * 1000);

  activeRooms.set(room._id.toString(), state);
};

// ─── MIND SNAP MODE ───────────────────────────────────────────────────────────

const generateMindSnapPattern = (gridSize) => {
  const total = gridSize * gridSize;
  const count = gridSize === 4
    ? 4 + Math.floor(Math.random() * 3)   // 4–6 colored cells for 4×4
    : 7 + Math.floor(Math.random() * 4);  // 7–10 colored cells for 5×5
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
};

const startMindSnapGame = async (io, room) => {
  const state = {
    gameMode: 'mind_snap',
    timeLeft: 60,
    boardNum: 0,
    currentPattern: [],
    gridSize: 4,
    answerWindowOpen: false,
    boardTimer: null,
    hideTimer: null,
    gameTimer: null,
    timerInterval: null,
    inactivityInterval: null,
    gameEnded: false,
    startTime: Date.now(),
    players: {},
  };

  for (const p of room.players) {
    const uid = p.userId.toString();
    state.players[uid] = {
      socketId: null,
      score: 0,
      boardsCompleted: 0,
      totalCorrectTaps: 0,
      totalPatternCells: 0,
      lastTapTime: Date.now(),
      warningSent: false,
      boardHistory: [],
      selectedCells: new Set(),
      cellResults: {},
    };
  }

  const roomSockets = await io.in(room.roomCode).fetchSockets();
  for (const s of roomSockets) {
    const uid = s.user?._id?.toString();
    if (uid && state.players[uid]) state.players[uid].socketId = s.id;
  }

  state.gameTimer = setTimeout(() => {
    if (!state.gameEnded) endMindSnapGame(io, room);
  }, 60 * 1000);

  let remaining = 60;
  io.to(room.roomCode).emit('game:globalTimer', { remaining, duration: 60 });
  state.timerInterval = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    state.timeLeft = remaining;
    io.to(room.roomCode).emit('game:globalTimer', { remaining, duration: 60 });
  }, 1000);

  // Inactivity check every 5s
  state.inactivityInterval = setInterval(() => {
    if (state.gameEnded) return;
    for (const [uid, ps] of Object.entries(state.players)) {
      const inactiveSec = (Date.now() - ps.lastTapTime) / 1000;
      if (inactiveSec >= 15 && !state.gameEnded) {
        state.gameEnded = true;
        clearInterval(state.inactivityInterval);
        const winnerId = Object.keys(state.players).find(id => id !== uid);
        endMindSnapGame(io, room, winnerId);
        return;
      }
      if (inactiveSec >= 10 && !ps.warningSent) {
        ps.warningSent = true;
        const sock = io.sockets.sockets.get(ps.socketId);
        if (sock) sock.emit('game:mindSnapWarning', { message: "You haven't tapped anything! Stay in the game!" });
      } else if (inactiveSec < 10) {
        ps.warningSent = false;
      }
    }
  }, 5000);

  activeRooms.set(room._id.toString(), state);
  setTimeout(() => runMindSnapBoard(io, room, state), 600);
};

const runMindSnapBoard = (io, room, state) => {
  if (state.gameEnded) return;

  const gridSize = state.timeLeft > 25 ? 4 : 5;
  const pattern = generateMindSnapPattern(gridSize);
  state.boardNum++;
  state.currentPattern = pattern;
  state.gridSize = gridSize;
  state.answerWindowOpen = false;

  for (const ps of Object.values(state.players)) {
    ps.selectedCells = new Set();
    ps.cellResults = {};
    ps.boardStartTime = null;
  }

  activeRooms.set(room._id.toString(), state);

  io.to(room.roomCode).emit('game:mindSnapPattern', {
    pattern,
    gridSize,
    boardNum: state.boardNum,
  });

  // After 2s memorize phase: hide and open answer window
  state.hideTimer = setTimeout(() => {
    if (state.gameEnded) return;
    state.answerWindowOpen = true;
    const now = Date.now();
    for (const ps of Object.values(state.players)) ps.boardStartTime = now;

    io.to(room.roomCode).emit('game:mindSnapHide', { boardNum: state.boardNum });

    state.boardTimer = setTimeout(() => {
      state.answerWindowOpen = false;
      evaluateMindSnapBoard(io, room, state);
    }, 5000);

    activeRooms.set(room._id.toString(), state);
  }, 2000);
};

const evaluateMindSnapBoard = (io, room, state) => {
  if (state.gameEnded) return;

  const patternSet = new Set(state.currentPattern);
  const playerResults = {};

  for (const [uid, ps] of Object.entries(state.players)) {
    const correctTaps = [...ps.selectedCells].filter(c => patternSet.has(c) && ps.cellResults[c] === 'correct');
    const wrongTaps = [...ps.selectedCells].filter(c => !patternSet.has(c));
    const missedCells = state.currentPattern.filter(c => ps.cellResults[c] !== 'correct');
    const points = correctTaps.length;
    const isComplete = correctTaps.length === state.currentPattern.length && wrongTaps.length === 0;
    const timeTaken = ps.boardStartTime ? (Date.now() - ps.boardStartTime) / 1000 : 5;

    ps.score += points;
    ps.totalCorrectTaps += correctTaps.length;
    ps.totalPatternCells += state.currentPattern.length;
    if (isComplete) ps.boardsCompleted++;

    ps.boardHistory.push({
      boardNum: state.boardNum,
      pattern: state.currentPattern,
      gridSize: state.gridSize,
      cellResults: { ...ps.cellResults },
      correctTaps: correctTaps.length,
      wrongTaps: wrongTaps.length,
      missedCells,
      points,
      isComplete,
      timeTaken,
      timestamp: Date.now() - state.startTime,
    });

    playerResults[uid] = {
      correctTaps: correctTaps.length,
      wrongTaps: wrongTaps.length,
      missedCells,
      points,
      totalScore: ps.score,
      isComplete,
      timeTaken,
    };
  }

  // Send per-player board results + broadcast score update
  for (const [uid, ps] of Object.entries(state.players)) {
    const sock = io.sockets.sockets.get(ps.socketId);
    const opponentId = Object.keys(state.players).find(id => id !== uid);
    const opponentResult = opponentId ? playerResults[opponentId] : null;

    if (sock) {
      sock.emit('game:mindSnapBoardEnd', {
        boardNum: state.boardNum,
        pattern: state.currentPattern,
        gridSize: state.gridSize,
        myResult: playerResults[uid],
        opponentScore: opponentResult?.totalScore ?? 0,
        opponentPoints: opponentResult?.points ?? 0,
      });
    }
  }

  io.to(room.roomCode).emit('game:mindSnapScore', {
    scores: Object.fromEntries(
      Object.entries(state.players).map(([uid, ps]) => [uid, ps.score])
    ),
  });

  activeRooms.set(room._id.toString(), state);

  setTimeout(() => {
    if (!state.gameEnded) runMindSnapBoard(io, room, state);
  }, 1500);
};

const endMindSnapGame = async (io, room, forcedWinnerId = null) => {
  const state = activeRooms.get(room._id.toString());
  if (!state || state.gameEnded) return;
  state.gameEnded = true;

  if (state.gameTimer) clearTimeout(state.gameTimer);
  if (state.timerInterval) clearInterval(state.timerInterval);
  if (state.inactivityInterval) clearInterval(state.inactivityInterval);
  if (state.boardTimer) clearTimeout(state.boardTimer);
  if (state.hideTimer) clearTimeout(state.hideTimer);

  const freshRoom = await GameRoom.findById(room._id);
  if (!freshRoom || freshRoom.status === 'finished') return;

  for (const [uid, ps] of Object.entries(state.players)) {
    const idx = freshRoom.players.findIndex(p => p.userId.toString() === uid);
    if (idx !== -1) {
      freshRoom.players[idx].score = ps.score;
      freshRoom.players[idx].correctCount = ps.boardsCompleted;
      freshRoom.players[idx].answeredCount = ps.boardHistory.length;
      freshRoom.players[idx].accuracy = ps.totalPatternCells > 0
        ? Math.round((ps.totalCorrectTaps / ps.totalPatternCells) * 100) : 0;
    }
  }

  if (forcedWinnerId) {
    freshRoom.winnerId = forcedWinnerId;
  } else {
    const sorted = Object.entries(state.players).map(([uid, ps]) => ({ uid, ps })).sort((a, b) => {
      if (b.ps.boardsCompleted !== a.ps.boardsCompleted) return b.ps.boardsCompleted - a.ps.boardsCompleted;
      const accA = a.ps.totalPatternCells > 0 ? a.ps.totalCorrectTaps / a.ps.totalPatternCells : 0;
      const accB = b.ps.totalPatternCells > 0 ? b.ps.totalCorrectTaps / b.ps.totalPatternCells : 0;
      if (Math.abs(accB - accA) > 0.001) return accB - accA;
      return b.ps.score - a.ps.score;
    });
    if (sorted.length >= 2 && sorted[0].ps.score !== sorted[1].ps.score ||
        sorted[0].ps.boardsCompleted !== sorted[1].ps.boardsCompleted) {
      freshRoom.winnerId = sorted[0].uid;
    }
  }

  freshRoom.status = 'finished';
  freshRoom.endedAt = new Date();
  await freshRoom.save();

  let xpResults = [];
  try { xpResults = await processMatchEnd(freshRoom); } catch (e) { console.error('XP error:', e.message); }

  const finalScores = freshRoom.players.map(p => {
    const uid = p.userId.toString();
    const xpData = xpResults.find(r => r.userId.toString() === uid);
    const ps = state.players[uid];
    return {
      userId: p.userId,
      score: ps?.score || 0,
      correctCount: ps?.boardsCompleted || 0,
      totalAnswered: ps?.boardHistory.length || 0,
      accuracy: p.accuracy || 0,
      xpEarned: xpData?.xpEarned || 0,
      ratingChange: xpData?.ratingDelta || 0,
      newAchievements: xpData?.newAchievements || [],
      boardHistory: ps?.boardHistory || [],
      totalCorrectTaps: ps?.totalCorrectTaps || 0,
      totalPatternCells: ps?.totalPatternCells || 0,
    };
  });

  io.to(freshRoom.roomCode).emit('game:finished', {
    winnerId: freshRoom.winnerId,
    finalScores,
    gameMode: 'mind_snap',
  });

  activeRooms.delete(room._id.toString());
};

// ─── Launch game after countdown ─────────────────────────────────────────────
const launchGame = (io, room) => {
  const gm = room.gameMode || 'ability';
  if (gm === 'sprint') return startSprintGame(io, room);
  if (gm === 'fast_first') return startFastFirstGame(io, room);
  if (gm === 'mind_snap') return startMindSnapGame(io, room);
  return startAbilityGame(io, room);
};

// ─── Register socket event handlers ──────────────────────────────────────────
const registerGameHandlers = (io, socket) => {

  // ── MATCHMAKING ──────────────────────────────────────────────────────────
  socket.on('queue:join', async ({ mode = 'matchmaking', category = 'math', gameMode = 'sprint' }) => {
    if (!socket.user) return;

    const categoryRating = {
      math: socket.user.mathRating,
      memory: socket.user.memoryRating,
      puzzle: socket.user.puzzleRating,
      logic: socket.user.logicRating,
    }[category] || socket.user.rating || 1000;

    addToQueue(socket.id, {
      userId: socket.user._id,
      username: socket.user.username,
      rating: categoryRating,
      category,
      gameMode,
    });

    const opponent = findMatch(socket.id);
    if (!opponent) return;

    removeFromQueue(socket.id);
    removeFromQueue(opponent.socketId);

    const roomCode = generateRoomCode();
    const room = await GameRoom.create({
      roomCode, mode, category, gameMode,
      players: [
        { userId: socket.user._id, score: 0, status: 'ready' },
        { userId: opponent.userId, score: 0, status: 'ready' },
      ],
      questions: [],
      status: 'active',
      startedAt: new Date(),
    });

    socket.join(roomCode);
    const oppSocket = io.sockets.sockets.get(opponent.socketId);
    if (oppSocket) oppSocket.join(roomCode);

    const matchBase = { roomId: room._id, roomCode, category, gameMode };
    socket.emit('queue:matched', {
      ...matchBase,
      opponent: { userId: opponent.userId, username: opponent.username, rating: opponent.rating },
    });
    if (oppSocket) {
      oppSocket.emit('queue:matched', {
        ...matchBase,
        opponent: { userId: socket.user._id, username: socket.user.username, rating: categoryRating },
      });
    }

    startCountdown(io, room, () => launchGame(io, room));
  });

  socket.on('queue:leave', () => removeFromQueue(socket.id));

  // ── PRIVATE ROOMS ─────────────────────────────────────────────────────────
  socket.on('room:create', async ({ roomCode, category = 'math', gameMode = 'sprint' }) => {
    if (!socket.user) return socket.emit('room:error', { message: 'Not authenticated' });
    try {
      let code = roomCode;
      const existing = await GameRoom.findOne({ roomCode: code });
      if (existing) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const retry = await GameRoom.findOne({ roomCode: code });
        if (retry) return socket.emit('room:error', { message: 'Code collision — try again' });
      }

      const room = await GameRoom.create({
        roomCode: code, mode: 'private', category, gameMode,
        players: [{ userId: socket.user._id, score: 0, status: 'ready' }],
        questions: [], status: 'waiting',
      });

      socket.join(code);
      socket.emit('room:created', { roomCode: code, roomId: room._id });
    } catch (err) {
      console.error('[room:create]', err.message);
      socket.emit('room:error', { message: 'Failed to create room' });
    }
  });

  socket.on('room:join', async ({ roomCode }) => {
    if (!socket.user) return socket.emit('room:error', { message: 'Not authenticated' });
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const room = await GameRoom.findOne({ roomCode: code, status: { $ne: 'finished' } });
      if (!room) return socket.emit('room:error', { message: 'Room not found' });

      const alreadyIn = room.players.some(p => p.userId.toString() === socket.user._id.toString());
      if (!alreadyIn) {
        if (room.players.length >= 2) return socket.emit('room:error', { message: 'Room is full' });
        room.players.push({ userId: socket.user._id, score: 0, status: 'ready' });
      }

      if (room.players.length === 2 && room.status === 'waiting') {
        room.status = 'active';
        room.startedAt = new Date();
      }
      await room.save();
      socket.join(code);

      if (room.status === 'active') {
        const roomSockets = await io.in(code).fetchSockets();
        for (const s of roomSockets) s.emit('room:joined', { room });
        startCountdown(io, room, () => launchGame(io, room));
      } else {
        socket.emit('room:joined', { room });
      }
    } catch (err) {
      console.error('[room:join]', err.message);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });

  // ── GAME ANSWER ───────────────────────────────────────────────────────────
  socket.on('game:answer', async ({ roomId, questionId, answer, timeTaken }) => {
    if (!socket.user) return;

    const room = await GameRoom.findById(roomId);
    if (!room || room.status !== 'active') return;

    const state = activeRooms.get(roomId.toString());
    if (!state) return;

    const userId = socket.user._id.toString();
    const playerIdx = room.players.findIndex(p => p.userId.toString() === userId);
    if (playerIdx === -1) return;

    // ── SPRINT ──────────────────────────────────────────────────────────────
    if (state.gameMode === 'sprint') {
      const ps = state.players[userId];
      if (!ps) return;

      // Validate answer matches current question for this player
      const q = state.questions[ps.questionIndex];
      if (!q || q._id !== questionId) return; // stale answer

      const isCorrect = String(answer).trim() === String(q.correctAnswer).trim();

      if (ps.questionTimer) clearTimeout(ps.questionTimer);

      ps.totalCount++;
      if (isCorrect) ps.correctCount++;

      ps.answerHistory.push({
        questionIndex: ps.questionIndex, isCorrect,
        timeTaken: Math.min(Number(timeTaken) || 0, MODE_CFG.sprint.qTimeout),
        questionType: q.type,
        timestamp: Date.now() - state.startTime,
      });

      room.players[playerIdx].answeredCount = ps.totalCount;
      room.players[playerIdx].correctCount = ps.correctCount;
      room.players[playerIdx].score = ps.correctCount;
      room.players[playerIdx].accuracy = Math.round((ps.correctCount / ps.totalCount) * 100);
      await room.save();

      io.to(room.roomCode).emit('game:scoreUpdate', {
        playerId: userId,
        score: ps.correctCount,
        totalAnswered: ps.totalCount,
        isCorrect,
      });

      activeRooms.set(roomId.toString(), state);
      sendSprintQuestion(io, socket, room, userId, ps.questionIndex + 1, state);

    // ── FAST & FIRST ─────────────────────────────────────────────────────────
    } else if (state.gameMode === 'fast_first') {
      if (state.questionAnswered) return; // already advanced

      const q = state.questions[state.currentQuestionIndex];
      if (!q) return;

      const isCorrect = String(answer).trim() === String(q.correctAnswer).trim();

      if (isCorrect) {
        state.questionAnswered = true;
        if (state.questionTimer) clearTimeout(state.questionTimer);

        room.players[playerIdx].correctCount = (room.players[playerIdx].correctCount || 0) + 1;
        room.players[playerIdx].answeredCount = (room.players[playerIdx].answeredCount || 0) + 1;
        room.players[playerIdx].score = room.players[playerIdx].correctCount;
        room.players[playerIdx].accuracy = Math.round(
          (room.players[playerIdx].correctCount / room.players[playerIdx].answeredCount) * 100
        );
        await room.save();

        if (!state.answerHistory[userId]) state.answerHistory[userId] = [];
        state.answerHistory[userId].push({
          questionIndex: state.currentQuestionIndex, isCorrect: true,
          timeTaken: Math.min(Number(timeTaken) || 0, MODE_CFG.fast_first.qTimeout),
          questionType: q.type,
        });

        io.to(room.roomCode).emit('game:scoreUpdate', {
          playerId: userId, score: room.players[playerIdx].correctCount, isCorrect: true,
          totalAnswered: room.players[playerIdx].answeredCount,
        });
        io.to(room.roomCode).emit('game:fastFirstCorrect', {
          playerId: userId, questionIndex: state.currentQuestionIndex,
        });

        activeRooms.set(roomId.toString(), state);

        // Brief pause so players see the "correct" state, then advance
        setTimeout(() => sendFastFirstQuestion(io, room, state.currentQuestionIndex + 1, state), 800);

      } else {
        // Wrong answer — notify, question stays, player can retry
        room.players[playerIdx].answeredCount = (room.players[playerIdx].answeredCount || 0) + 1;
        await room.save();

        socket.emit('game:fastFirstWrong', { questionIndex: state.currentQuestionIndex });
        socket.to(room.roomCode).emit('game:fastFirstOpponentWrong', {
          playerId: userId, questionIndex: state.currentQuestionIndex,
        });

        activeRooms.set(roomId.toString(), state);
      }

    // ── ABILITY (synchronized) ───────────────────────────────────────────────
    } else {
      const q = await Question.findById(questionId);
      if (!q) return;

      const cfg = MODE_CFG[state.gameMode] || MODE_CFG.ability;
      const isCorrect = String(answer).trim() === String(q.correctAnswer).trim();
      const timeBonus = isCorrect ? Math.max(0, Math.floor((cfg.qTimeout - (Number(timeTaken) || 0)) / 2)) : 0;
      const scoreGain = isCorrect ? 10 + timeBonus : 0;

      room.players[playerIdx].score += scoreGain;
      room.players[playerIdx].answeredCount = (room.players[playerIdx].answeredCount || 0) + 1;
      if (isCorrect) room.players[playerIdx].correctCount = (room.players[playerIdx].correctCount || 0) + 1;
      room.players[playerIdx].accuracy = Math.round(
        ((room.players[playerIdx].correctCount || 0) / room.players[playerIdx].answeredCount) * 100
      );
      await room.save();

      io.to(room.roomCode).emit('game:scoreUpdate', {
        playerId: userId, score: room.players[playerIdx].score, isCorrect,
        totalAnswered: room.players[playerIdx].answeredCount,
      });
      socket.to(room.roomCode).emit('game:opponentStatus', { status: 'answered' });

      if (!state.answerHistory[userId]) state.answerHistory[userId] = [];
      state.answerHistory[userId].push({
        questionIndex: state.currentQuestionIndex, isCorrect,
        timeTaken: Math.min(Number(timeTaken) || 0, cfg.qTimeout),
        questionType: q.type,
      });

      if (!state.answers) state.answers = {};
      state.answers[userId] = answer;
      const answeredCount = Object.keys(state.answers).length;

      if (answeredCount >= room.players.length) {
        clearTimeout(state.timer);
        state.answers = {};
        activeRooms.set(roomId.toString(), state);
        sendAbilityQuestion(io, room, state.currentQuestionIndex + 1, state);
      } else {
        activeRooms.set(roomId.toString(), state);
      }
    }
  });

  // ── MIND SNAP TAP ─────────────────────────────────────────────────────────
  socket.on('game:mindSnapTap', ({ roomId, boardNum, cellIndex }) => {
    if (!socket.user) return;
    const state = activeRooms.get(roomId?.toString());
    if (!state || state.gameMode !== 'mind_snap' || state.gameEnded) return;
    if (boardNum !== state.boardNum || !state.answerWindowOpen) return;

    const userId = socket.user._id.toString();
    const ps = state.players[userId];
    if (!ps) return;
    if (ps.selectedCells.has(cellIndex)) return; // already tapped

    ps.selectedCells.add(cellIndex);
    ps.lastTapTime = Date.now();
    ps.warningSent = false;

    const isCorrect = state.currentPattern.includes(cellIndex);
    ps.cellResults[cellIndex] = isCorrect ? 'correct' : 'wrong';

    activeRooms.set(roomId.toString(), state);

    socket.emit('game:mindSnapTapResult', { cellIndex, correct: isCorrect, boardNum });
  });

  // ── REMATCH ───────────────────────────────────────────────────────────────
  socket.on('game:rematchRequest', async ({ roomId }) => {
    if (!socket.user) return;
    const room = await GameRoom.findById(roomId);
    if (!room) return;
    socket.to(room.roomCode).emit('game:rematchRequest', { userId: socket.user._id });
  });

  socket.on('game:rematchAccept', async ({ roomId }) => {
    if (!socket.user) return;
    const oldRoom = await GameRoom.findById(roomId);
    if (!oldRoom) return;

    const roomCode = generateRoomCode();
    const newRoom = await GameRoom.create({
      roomCode,
      mode: oldRoom.mode,
      category: oldRoom.category,
      gameMode: oldRoom.gameMode,
      players: oldRoom.players.map(p => ({ userId: p.userId, score: 0, status: 'ready' })),
      questions: [],
      status: 'active',
      startedAt: new Date(),
    });

    const roomSockets = await io.in(oldRoom.roomCode).fetchSockets();
    for (const s of roomSockets) {
      s.leave(oldRoom.roomCode);
      s.join(roomCode);
    }

    io.to(roomCode).emit('game:rematchAccept', {
      roomId: newRoom._id, roomCode, gameMode: newRoom.gameMode,
    });
    startCountdown(io, newRoom, () => launchGame(io, newRoom));
  });

  socket.on('disconnect', () => removeFromQueue(socket.id));
};

module.exports = { registerGameHandlers };
