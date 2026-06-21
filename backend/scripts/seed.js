require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Question = require('../models/Question');
const Tournament = require('../models/Tournament');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

const QUESTIONS = [
  // EASY — addition
  { type: 'addition', difficulty: 'easy', prompt: '12 + 15 = ?', options: ['25', '27', '28', '26'], correctAnswer: '27' },
  { type: 'addition', difficulty: 'easy', prompt: '34 + 21 = ?', options: ['55', '56', '54', '57'], correctAnswer: '55' },
  { type: 'addition', difficulty: 'easy', prompt: '47 + 38 = ?', options: ['83', '85', '84', '86'], correctAnswer: '85' },
  { type: 'addition', difficulty: 'easy', prompt: '56 + 29 = ?', options: ['83', '85', '84', '86'], correctAnswer: '85' },
  { type: 'addition', difficulty: 'easy', prompt: '18 + 63 = ?', options: ['79', '81', '82', '80'], correctAnswer: '81' },
  { type: 'addition', difficulty: 'easy', prompt: '72 + 19 = ?', options: ['91', '90', '89', '92'], correctAnswer: '91' },
  // EASY — subtraction
  { type: 'subtraction', difficulty: 'easy', prompt: '50 - 18 = ?', options: ['30', '32', '33', '31'], correctAnswer: '32' },
  { type: 'subtraction', difficulty: 'easy', prompt: '73 - 27 = ?', options: ['44', '45', '46', '47'], correctAnswer: '46' },
  { type: 'subtraction', difficulty: 'easy', prompt: '100 - 64 = ?', options: ['34', '35', '36', '37'], correctAnswer: '36' },
  { type: 'subtraction', difficulty: 'easy', prompt: '85 - 39 = ?', options: ['44', '45', '46', '47'], correctAnswer: '46' },
  // EASY — multiplication
  { type: 'multiplication', difficulty: 'easy', prompt: '6 × 7 = ?', options: ['36', '42', '48', '40'], correctAnswer: '42' },
  { type: 'multiplication', difficulty: 'easy', prompt: '8 × 9 = ?', options: ['63', '72', '81', '64'], correctAnswer: '72' },
  { type: 'multiplication', difficulty: 'easy', prompt: '7 × 7 = ?', options: ['42', '49', '56', '48'], correctAnswer: '49' },
  { type: 'multiplication', difficulty: 'easy', prompt: '9 × 6 = ?', options: ['54', '56', '48', '63'], correctAnswer: '54' },
  { type: 'multiplication', difficulty: 'easy', prompt: '4 × 12 = ?', options: ['44', '46', '48', '52'], correctAnswer: '48' },
  // EASY — division
  { type: 'division', difficulty: 'easy', prompt: '72 ÷ 8 = ?', options: ['7', '8', '9', '10'], correctAnswer: '9' },
  { type: 'division', difficulty: 'easy', prompt: '56 ÷ 7 = ?', options: ['6', '7', '8', '9'], correctAnswer: '8' },
  { type: 'division', difficulty: 'easy', prompt: '48 ÷ 6 = ?', options: ['6', '7', '8', '9'], correctAnswer: '8' },
  { type: 'division', difficulty: 'easy', prompt: '63 ÷ 9 = ?', options: ['5', '6', '7', '8'], correctAnswer: '7' },
  // EASY — percentage
  { type: 'percentage', difficulty: 'easy', prompt: '10% of 80 = ?', options: ['6', '7', '8', '9'], correctAnswer: '8' },
  { type: 'percentage', difficulty: 'easy', prompt: '50% of 60 = ?', options: ['25', '30', '35', '20'], correctAnswer: '30' },
  { type: 'percentage', difficulty: 'easy', prompt: '25% of 40 = ?', options: ['8', '10', '12', '15'], correctAnswer: '10' },

  // MEDIUM — addition
  { type: 'addition', difficulty: 'medium', prompt: '347 + 285 = ?', options: ['622', '632', '632', '642'], correctAnswer: '632' },
  { type: 'addition', difficulty: 'medium', prompt: '563 + 478 = ?', options: ['1031', '1041', '1051', '1021'], correctAnswer: '1041' },
  { type: 'addition', difficulty: 'medium', prompt: '129 + 876 = ?', options: ['995', '1005', '1015', '985'], correctAnswer: '1005' },
  // MEDIUM — subtraction
  { type: 'subtraction', difficulty: 'medium', prompt: '503 - 178 = ?', options: ['315', '325', '335', '305'], correctAnswer: '325' },
  { type: 'subtraction', difficulty: 'medium', prompt: '1000 - 437 = ?', options: ['553', '563', '573', '543'], correctAnswer: '563' },
  { type: 'subtraction', difficulty: 'medium', prompt: '742 - 369 = ?', options: ['363', '373', '383', '353'], correctAnswer: '373' },
  // MEDIUM — multiplication
  { type: 'multiplication', difficulty: 'medium', prompt: '12 × 13 = ?', options: ['144', '146', '154', '156'], correctAnswer: '156' },
  { type: 'multiplication', difficulty: 'medium', prompt: '14 × 15 = ?', options: ['200', '205', '210', '215'], correctAnswer: '210' },
  { type: 'multiplication', difficulty: 'medium', prompt: '17 × 18 = ?', options: ['296', '300', '306', '312'], correctAnswer: '306' },
  { type: 'multiplication', difficulty: 'medium', prompt: '23 × 24 = ?', options: ['542', '552', '562', '572'], correctAnswer: '552' },
  { type: 'multiplication', difficulty: 'medium', prompt: '16 × 19 = ?', options: ['294', '296', '302', '304'], correctAnswer: '304' },
  // MEDIUM — division
  { type: 'division', difficulty: 'medium', prompt: '144 ÷ 12 = ?', options: ['10', '11', '12', '13'], correctAnswer: '12' },
  { type: 'division', difficulty: 'medium', prompt: '225 ÷ 15 = ?', options: ['13', '14', '15', '16'], correctAnswer: '15' },
  { type: 'division', difficulty: 'medium', prompt: '196 ÷ 14 = ?', options: ['12', '13', '14', '15'], correctAnswer: '14' },
  // MEDIUM — percentage
  { type: 'percentage', difficulty: 'medium', prompt: '15% of 200 = ?', options: ['25', '30', '35', '40'], correctAnswer: '30' },
  { type: 'percentage', difficulty: 'medium', prompt: '35% of 80 = ?', options: ['24', '26', '28', '30'], correctAnswer: '28' },
  { type: 'percentage', difficulty: 'medium', prompt: '20% of 350 = ?', options: ['60', '65', '70', '75'], correctAnswer: '70' },
  // MEDIUM — sequence
  { type: 'sequence', difficulty: 'medium', prompt: '2, 4, 8, 16, __?', options: ['24', '28', '32', '36'], correctAnswer: '32' },
  { type: 'sequence', difficulty: 'medium', prompt: '3, 6, 12, 24, __?', options: ['36', '42', '48', '54'], correctAnswer: '48' },
  { type: 'sequence', difficulty: 'medium', prompt: '1, 4, 9, 16, __?', options: ['20', '23', '25', '28'], correctAnswer: '25' },
  { type: 'sequence', difficulty: 'medium', prompt: '5, 10, 20, 40, __?', options: ['60', '70', '80', '90'], correctAnswer: '80' },
  { type: 'sequence', difficulty: 'medium', prompt: '1, 1, 2, 3, 5, 8, __?', options: ['11', '12', '13', '14'], correctAnswer: '13' },

  // HARD — multiplication
  { type: 'multiplication', difficulty: 'hard', prompt: '37 × 43 = ?', options: ['1581', '1591', '1601', '1611'], correctAnswer: '1591' },
  { type: 'multiplication', difficulty: 'hard', prompt: '56 × 78 = ?', options: ['4258', '4268', '4278', '4368'], correctAnswer: '4368' },
  { type: 'multiplication', difficulty: 'hard', prompt: '89 × 97 = ?', options: ['8613', '8623', '8633', '8643'], correctAnswer: '8633' },
  { type: 'multiplication', difficulty: 'hard', prompt: '47 × 53 = ?', options: ['2381', '2391', '2401', '2411'], correctAnswer: '2491' },
  { type: 'multiplication', difficulty: 'hard', prompt: '64 × 75 = ?', options: ['4780', '4790', '4800', '4810'], correctAnswer: '4800' },
  // HARD — percentage
  { type: 'percentage', difficulty: 'hard', prompt: '37.5% of 240 = ?', options: ['80', '85', '90', '95'], correctAnswer: '90' },
  { type: 'percentage', difficulty: 'hard', prompt: 'If 60 is 40% of X, what is X?', options: ['120', '140', '150', '160'], correctAnswer: '150' },
  { type: 'percentage', difficulty: 'hard', prompt: '125% of 480 = ?', options: ['580', '590', '600', '610'], correctAnswer: '600' },
  // HARD — logic
  { type: 'logic', difficulty: 'hard', prompt: 'A train travels 120km in 1.5 hours. Speed in km/h?', options: ['70', '75', '80', '85'], correctAnswer: '80' },
  { type: 'logic', difficulty: 'hard', prompt: 'If 5 machines make 5 parts in 5 minutes, how many minutes for 100 machines to make 100 parts?', options: ['1', '5', '10', '100'], correctAnswer: '5' },
  { type: 'logic', difficulty: 'hard', prompt: 'A bat and ball cost $1.10 total. Bat costs $1 more than ball. Cost of ball in cents?', options: ['5', '10', '15', '20'], correctAnswer: '5' },
  // HARD — sequence
  { type: 'sequence', difficulty: 'hard', prompt: '2, 3, 5, 7, 11, 13, __?', options: ['15', '17', '19', '21'], correctAnswer: '17' },
  { type: 'sequence', difficulty: 'hard', prompt: '1, 2, 6, 24, 120, __?', options: ['480', '600', '720', '840'], correctAnswer: '720' },
  { type: 'sequence', difficulty: 'hard', prompt: '0, 1, 1, 2, 3, 5, 8, 13, __?', options: ['18', '20', '21', '24'], correctAnswer: '21' },
  // HARD — pattern
  { type: 'pattern', difficulty: 'hard', prompt: 'What comes next: 2, 6, 12, 20, 30, __?', options: ['38', '40', '42', '44'], correctAnswer: '42' },
  { type: 'pattern', difficulty: 'hard', prompt: '1, 3, 7, 15, 31, __?', options: ['55', '61', '63', '65'], correctAnswer: '63' },
];

const ACHIEVEMENTS = [
  { key: 'first_win', title: 'First Win', description: 'Win your first match', iconUrl: '🏆', criteria: { type: 'wins', threshold: 1 } },
  { key: 'wins_10', title: 'On a Roll', description: 'Win 10 matches', iconUrl: '🔥', criteria: { type: 'wins', threshold: 10 } },
  { key: 'wins_100', title: 'Century', description: 'Win 100 matches', iconUrl: '💯', criteria: { type: 'wins', threshold: 100 } },
  { key: 'perfect_accuracy', title: 'Perfect Mind', description: 'Complete a match with 100% accuracy', iconUrl: '🧠', criteria: { type: 'perfect_match', threshold: 1 } },
  { key: 'streak_5', title: 'Hot Streak', description: 'Win 5 matches in a row', iconUrl: '⚡', criteria: { type: 'streak', threshold: 5 } },
  { key: 'streak_10', title: 'Unstoppable', description: 'Win 10 matches in a row', iconUrl: '🌪️', criteria: { type: 'streak', threshold: 10 } },
  { key: 'champion', title: 'Champion', description: 'Win a tournament', iconUrl: '👑', criteria: { type: 'tournament_win', threshold: 1 } },
];

const TOURNAMENTS = [
  {
    name: 'Summer Sprint 2026',
    status: 'registration',
    participants: [],
    bracket: [],
    startDate: new Date('2026-07-01'),
    maxParticipants: 16,
    description: 'The flagship summer tournament. 16 players, single elimination. Prove you are the fastest mind.',
    prizeXp: 1000,
  },
  {
    name: 'Weekly Blitz #24',
    status: 'registration',
    participants: [],
    bracket: [],
    startDate: new Date('2026-06-22'),
    maxParticipants: 8,
    description: 'Quick 8-player weekly. Perfect for testing your current form.',
    prizeXp: 300,
  },
  {
    name: 'Grand Masters Invitational',
    status: 'registration',
    participants: [],
    bracket: [],
    startDate: new Date('2026-07-15'),
    maxParticipants: 16,
    description: 'By invitation only — top 16 rated players go head-to-head for ultimate bragging rights.',
    prizeXp: 2000,
  },
  {
    name: 'Rookie Rumble',
    status: 'registration',
    participants: [],
    bracket: [],
    startDate: new Date('2026-06-25'),
    maxParticipants: 32,
    description: 'Open to players under 1200 rating. Your first step into tournament play.',
    prizeXp: 250,
  },
  {
    name: 'Speed Round Championship',
    status: 'completed',
    participants: [],
    bracket: [],
    startDate: new Date('2026-06-10'),
    maxParticipants: 8,
    description: 'Fast-paced knockout — all matches capped at 5 questions.',
    prizeXp: 500,
  },
  {
    name: 'Mental Math Open — June',
    status: 'completed',
    participants: [],
    bracket: [],
    startDate: new Date('2026-06-01'),
    maxParticipants: 16,
    description: 'Monthly open bracket. Mixed difficulty questions, all categories in play.',
    prizeXp: 750,
  },
  {
    name: 'Lightning Round Qualifiers',
    status: 'active',
    participants: [],
    bracket: [],
    startDate: new Date('2026-06-18'),
    maxParticipants: 8,
    description: 'Qualifiers for the Lightning Round Championship. Top 4 advance.',
    prizeXp: 400,
  },
];

const FAKE_USERS = [
  { username: 'NeonCalc', email: 'neoncalc@mathverse.gg', rating: 2341, rank: 'Grandmaster', xp: 18400, stats: { wins: 412, losses: 89, totalMatches: 501, accuracy: 94, winRate: 82, currentStreak: 7, bestStreak: 21 } },
  { username: 'Zephyrix', email: 'zephyrix@mathverse.gg', rating: 2198, rank: 'Grandmaster', xp: 16200, stats: { wins: 384, losses: 102, totalMatches: 486, accuracy: 91, winRate: 79, currentStreak: 3, bestStreak: 18 } },
  { username: 'MatrixKid', email: 'matrixkid@mathverse.gg', rating: 2054, rank: 'Master', xp: 13800, stats: { wins: 297, losses: 130, totalMatches: 427, accuracy: 88, winRate: 70, currentStreak: 0, bestStreak: 14 } },
  { username: 'AlphaOmega', email: 'alphaomega@mathverse.gg', rating: 1987, rank: 'Master', xp: 12100, stats: { wins: 264, losses: 118, totalMatches: 382, accuracy: 86, winRate: 69, currentStreak: 5, bestStreak: 12 } },
  { username: 'SpeedMath', email: 'speedmath@mathverse.gg', rating: 1923, rank: 'Expert', xp: 10500, stats: { wins: 231, losses: 143, totalMatches: 374, accuracy: 83, winRate: 62, currentStreak: 2, bestStreak: 9 } },
  { username: 'QuantumLeap', email: 'quantumleap@mathverse.gg', rating: 1876, rank: 'Expert', xp: 9800, stats: { wins: 208, losses: 155, totalMatches: 363, accuracy: 81, winRate: 57, currentStreak: 0, bestStreak: 8 } },
  { username: 'PrimeFactor', email: 'primefactor@mathverse.gg', rating: 1812, rank: 'Expert', xp: 8900, stats: { wins: 189, losses: 162, totalMatches: 351, accuracy: 79, winRate: 54, currentStreak: 1, bestStreak: 7 } },
  { username: 'BinaryBolt', email: 'binarybolt@mathverse.gg', rating: 1754, rank: 'Advanced', xp: 7600, stats: { wins: 167, losses: 170, totalMatches: 337, accuracy: 77, winRate: 50, currentStreak: 0, bestStreak: 6 } },
  { username: 'LogicStorm', email: 'logicstorm@mathverse.gg', rating: 1698, rank: 'Advanced', xp: 6800, stats: { wins: 148, losses: 179, totalMatches: 327, accuracy: 75, winRate: 45, currentStreak: 3, bestStreak: 5 } },
  { username: 'PiCrunch', email: 'picrunch@mathverse.gg', rating: 1645, rank: 'Advanced', xp: 6100, stats: { wins: 134, losses: 187, totalMatches: 321, accuracy: 73, winRate: 42, currentStreak: 0, bestStreak: 4 } },
  { username: 'SigmaRush', email: 'sigmarush@mathverse.gg', rating: 1589, rank: 'Skilled', xp: 5400, stats: { wins: 119, losses: 196, totalMatches: 315, accuracy: 71, winRate: 38, currentStreak: 2, bestStreak: 6 } },
  { username: 'VectorViper', email: 'vectorviper@mathverse.gg', rating: 1523, rank: 'Skilled', xp: 4800, stats: { wins: 104, losses: 204, totalMatches: 308, accuracy: 69, winRate: 34, currentStreak: 0, bestStreak: 3 } },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Questions
  const existingCount = await Question.countDocuments();
  if (existingCount === 0) {
    await Question.insertMany(QUESTIONS.map(q => ({ ...q, generatedBy: 'system' })));
    console.log(`✓ Seeded ${QUESTIONS.length} questions`);
  } else {
    console.log(`  Questions already exist (${existingCount}), skipping`);
  }

  // Achievements
  for (const ach of ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate({ key: ach.key }, ach, { upsert: true });
  }
  console.log(`✓ Seeded ${ACHIEVEMENTS.length} achievements`);

  // Tournaments
  const tCount = await Tournament.countDocuments();
  if (tCount === 0) {
    await Tournament.insertMany(TOURNAMENTS);
    console.log(`✓ Seeded ${TOURNAMENTS.length} tournaments`);
  } else {
    console.log(`  Tournaments already exist (${tCount}), skipping`);
  }

  // Fake users for leaderboard
  const uCount = await User.countDocuments();
  if (uCount === 0) {
    const hash = await bcrypt.hash('Mathverse2026!', 12);
    await User.insertMany(
      FAKE_USERS.map(u => ({
        username: u.username,
        email: u.email,
        passwordHash: hash,
        rating: u.rating,
        rank: u.rank,
        xp: u.xp,
        stats: u.stats,
      }))
    );
    console.log(`✓ Seeded ${FAKE_USERS.length} fake users`);
  } else {
    console.log(`  Users already exist (${uCount}), skipping`);
  }

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
