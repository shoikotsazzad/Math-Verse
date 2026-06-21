const queue = new Map(); // socketId -> { userId, username, rating, socketId, category, gameMode }

const addToQueue = (socketId, userData) => {
  queue.set(socketId, { ...userData, socketId, joinedAt: Date.now() });
};

const removeFromQueue = (socketId) => {
  queue.delete(socketId);
};

const findMatch = (socketId) => {
  const current = queue.get(socketId);
  if (!current) return null;

  for (const [id, candidate] of queue) {
    if (id === socketId) continue;
    const sameCategory = current.category === candidate.category;
    const ratingClose = Math.abs(current.rating - candidate.rating) <= 200;
    const waitedLong = Date.now() - current.joinedAt > 10000;
    if (sameCategory && (ratingClose || waitedLong)) {
      return candidate;
    }
  }
  return null;
};

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = { addToQueue, removeFromQueue, findMatch, generateRoomCode };
