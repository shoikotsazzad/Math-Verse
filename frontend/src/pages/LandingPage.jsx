import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlowButton from '../components/ui/GlowButton';
import StatPill from '../components/ui/StatPill';
import Avatar from '../components/ui/Avatar';

const FEATURES = [
  { icon: '⚡', title: 'Real-Time Battles', desc: 'Go head-to-head with opponents live. Every millisecond counts.' },
  { icon: '🏆', title: 'Ranked Matchmaking', desc: 'Climb from Novice to Grandmaster with our Elo-based rating system.' },
  { icon: '📅', title: 'Daily Challenges', desc: 'A new set of problems every day. Top the daily leaderboard.' },
  { icon: '🎖️', title: 'Achievements', desc: 'Unlock badges for streaks, perfect accuracy, and tournament wins.' },
  { icon: '🏟️', title: 'Tournaments', desc: 'Enter single-elimination brackets and compete for champion status.' },
  { icon: '📊', title: 'Deep Stats', desc: 'Track accuracy, win rate, streaks, and XP earned over time.' },
];

const STEPS = [
  { step: '01', title: 'Create an account', desc: 'Sign up free and get your starting rating.' },
  { step: '02', title: 'Enter the queue', desc: 'Hit Play. Get matched with a rival at your level in seconds.' },
  { step: '03', title: 'Answer fast, score big', desc: 'Speed + accuracy = score. First to dominate 10 questions wins.' },
  { step: '04', title: 'Earn XP & climb', desc: 'Rank up, unlock achievements, enter tournaments.' },
];

const MOCK_LEADERS = [
  { username: 'NeonCalc', rating: 2341, wins: 412, rank: 'Grandmaster' },
  { username: 'Zephyrix', rating: 2198, wins: 384, rank: 'Grandmaster' },
  { username: 'MatrixKid', rating: 2054, wins: 297, rank: 'Master' },
  { username: 'AlphaOmega', rating: 1987, wins: 264, rank: 'Master' },
  { username: 'SpeedMath', rating: 1923, wins: 231, rank: 'Expert' },
];

const TESTIMONIALS = [
  { username: 'Zephyrix', text: 'I went from struggling with division to being top 50 global in 3 weeks. The ranked system is addictive.', rating: 2198 },
  { username: 'NeonCalc', text: 'Tournaments feel like real esports. The bracket UI is clean and the competition is fierce.', rating: 2341 },
  { username: 'SpeedMath', text: 'Daily challenges are the first thing I open every morning. The streak system keeps me honest.', rating: 1923 },
];

const FAQ = [
  { q: 'Is MathVerse free?', a: 'Yes. Core features including matchmaking, leaderboards, and daily challenges are completely free.' },
  { q: 'What math topics are covered?', a: 'Addition, subtraction, multiplication, division, percentages, sequences, logic, patterns, and memory challenges.' },
  { q: 'How does ranking work?', a: 'We use an Elo-inspired rating system. Win → gain rating. Lose → lose some. Play enough matches to place accurately.' },
  { q: 'Can I play with friends?', a: 'Yes — create a private room and share the room code with anyone you want to challenge.' },
  { q: 'How are tournaments structured?', a: 'Single-elimination. Admin creates the event, you register, bracket auto-generates when registration closes.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-4 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          className="max-w-4xl mx-auto relative z-10"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-accent text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live matches happening now
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-heading font-bold text-white leading-tight mb-6">
            Mental Math.<br />
            <span className="text-accent">Competitive Sport.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Battle real opponents in real time. Answer faster. Score higher. Climb the ranks.
            MathVerse is the competitive arena your brain deserves.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton onClick={() => navigate('/register')} className="text-base px-8 py-4">
              Start Playing Free
            </GlowButton>
            <GlowButton variant="outline" onClick={() => navigate('/leaderboard')} className="text-base px-8 py-4">
              View Leaderboard
            </GlowButton>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mt-12">
            <StatPill label="Active Players" value="12,400+" />
            <StatPill label="Matches Today" value="8,200+" />
            <StatPill label="Questions Answered" value="2.1M+" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="page-container">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              Everything a competitor needs
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted max-w-xl mx-auto">
              Built for speed, depth, and serious competition. Not your average math app.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          >
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp} className="glass p-6 hover:border-white/20 hover:bg-white/8 transition-all duration-200">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-heading font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-white/[0.02]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">How it works</h2>
            <p className="text-muted">From zero to ranked in under five minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="glass p-6 h-full">
                  <div className="text-accent font-heading font-bold text-4xl mb-4 opacity-60">{s.step}</div>
                  <h3 className="font-heading font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-muted text-sm">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Leaderboard Preview */}
      <section id="leaderboard-preview" className="py-24 px-4">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                The world's best<br /><span className="text-accent">math minds</span>, ranked live
              </h2>
              <p className="text-muted mb-6 leading-relaxed">
                Every match updates your global ranking in real time. Where do you stand?
              </p>
              <GlowButton onClick={() => navigate('/leaderboard')}>
                See Full Leaderboard
              </GlowButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="glass overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-heading font-semibold text-white">Global Rankings</span>
                <span className="text-xs text-muted">Live</span>
              </div>
              {MOCK_LEADERS.map((u, i) => (
                <div key={u.username} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <span className={`w-6 text-center font-heading font-bold text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted'}`}>
                    {i + 1}
                  </span>
                  <Avatar username={u.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{u.username}</div>
                    <div className="text-xs text-muted">{u.rank}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-accent font-heading font-bold text-sm">{u.rating}</div>
                    <div className="text-xs text-muted">{u.wins}W</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white/[0.02]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">From the community</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.username}
                className="glass p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-text-base text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <Avatar username={t.username} size="sm" />
                  <div>
                    <div className="font-medium text-white text-sm">{t.username}</div>
                    <div className="text-xs text-accent">{t.rating} Rating</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="page-container max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Frequently asked</h2>
            <p className="text-muted">Click any question to reveal the answer.</p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={item.q}
                  className="glass overflow-hidden"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="font-heading font-semibold text-white">{item.q}</span>
                    <span className={`text-accent text-xl shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <p className="text-muted text-sm leading-relaxed px-6 pb-5">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="page-container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
            className="glass p-12 max-w-2xl mx-auto border-accent/20"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              Your first match is waiting.
            </h2>
            <p className="text-muted mb-8">Create a free account and get into the queue in under 60 seconds.</p>
            <GlowButton onClick={() => navigate('/register')} className="text-base px-10 py-4">
              Play Now — It's Free
            </GlowButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
