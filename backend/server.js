require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const initSockets = require('./sockets');
const { seedAchievements } = require('./services/xpService');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const questionRoutes = require('./routes/questions');
const dailyChallengeRoutes = require('./routes/dailyChallenge');
const tournamentRoutes = require('./routes/tournaments');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || null;

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.*\.vercel\.app$/,
];
if (CLIENT_URL) allowedOrigins.push(CLIENT_URL);

const allowedOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // non-browser / server-to-server
  const ok = allowedOrigins.some(p =>
    typeof p === 'string' ? p === origin : p.test(origin)
  );
  cb(ok ? null : new Error('CORS blocked'), ok);
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/daily-challenge', dailyChallengeRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

// Socket.IO
initSockets(io);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAchievements();
  server.listen(PORT, () => {
    console.log(`MathVerse server running on port ${PORT}`);
  });
});
