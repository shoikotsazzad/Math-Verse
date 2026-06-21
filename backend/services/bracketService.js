const generateBracket = (participants) => {
  const ids = [...participants].map(p => p._id || p);

  // Pad to next power of 2 with byes (null)
  let size = 1;
  while (size < ids.length) size *= 2;
  while (ids.length < size) ids.push(null);

  // Shuffle for random seeding
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const rounds = [];
  let currentRound = [];

  for (let i = 0; i < ids.length; i += 2) {
    currentRound.push({
      player1: ids[i],
      player2: ids[i + 1],
      winner: ids[i + 1] === null ? ids[i] : null, // auto-advance on bye
      isBye: ids[i + 1] === null,
    });
  }

  rounds.push({ round: 1, matches: currentRound });

  let totalRounds = Math.log2(size);
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = Math.pow(2, totalRounds - r);
    const matches = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({ player1: null, player2: null, winner: null, isBye: false });
    }
    rounds.push({ round: r, matches });
  }

  return rounds;
};

module.exports = { generateBracket };
