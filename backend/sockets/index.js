const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerGameHandlers } = require('./gameHandler');

const initSockets = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Not authenticated'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user || user.isBanned) return next(new Error('Not authorized'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user?.username} (${socket.id})`);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user?.username} (${socket.id})`);
    });
  });
};

module.exports = initSockets;
