import { create } from 'zustand';

const useGameStore = create((set) => ({
  // Room info
  roomId: null,
  roomCode: null,
  opponent: null,
  gameMode: null,       // 'sprint' | 'fast_first' | 'ability' | ...
  category: null,

  // Question state
  currentQuestion: null,
  currentIndex: 0,
  totalQuestions: null,
  timeLeft: 15,

  // Score state
  myScore: 0,             // correct count for sprint/fast_first, points for ability
  opponentScore: 0,
  myCorrect: 0,
  opponentCorrect: 0,
  myTotal: 0,
  opponentTotal: 0,

  // Sprint global timer
  globalTimeLeft: 60,
  globalDuration: 60,

  // Game flow
  status: 'idle',   // idle | queuing | countdown | playing | finished
  countdown: 3,
  results: null,
  isCorrect: null,

  // Analysis data
  answerLog: [],          // [{questionIndex, isCorrect, timeTaken, questionType, timestamp}]
  gameStartTime: null,

  // Setters
  setRoom: (roomId, roomCode, opponent, gameMode, category) =>
    set({ roomId, roomCode, opponent, gameMode, category }),
  setStatus: (status) => set({ status }),
  setCountdown: (countdown) => set({ countdown }),
  setQuestion: (question, index, timeLimit, total) =>
    set({ currentQuestion: question, currentIndex: index, timeLeft: timeLimit || 15, totalQuestions: total || null, isCorrect: null }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setGlobalTimer: (remaining, duration) =>
    set({ globalTimeLeft: remaining, globalDuration: duration || 60 }),

  updateMyScore: (score, correct, total) =>
    set({ myScore: score, myCorrect: correct ?? score, myTotal: total ?? 0 }),
  updateOpponentScore: (score, correct, total) =>
    set({ opponentScore: score, opponentCorrect: correct ?? score, opponentTotal: total ?? 0 }),

  setResults: (results) => set({ results, status: 'finished' }),
  setAnswerFeedback: (isCorrect) => set({ isCorrect }),

  addAnswerLog: (entry) => set(s => ({ answerLog: [...s.answerLog, entry] })),
  setGameStartTime: (t) => set({ gameStartTime: t }),

  reset: () => set({
    roomId: null, roomCode: null, opponent: null, gameMode: null, category: null,
    currentQuestion: null, currentIndex: 0, totalQuestions: null, timeLeft: 15,
    myScore: 0, opponentScore: 0, myCorrect: 0, opponentCorrect: 0,
    myTotal: 0, opponentTotal: 0,
    globalTimeLeft: 60, globalDuration: 60,
    status: 'idle', countdown: 3, results: null, isCorrect: null,
    answerLog: [], gameStartTime: null,
  }),
}));

export default useGameStore;
