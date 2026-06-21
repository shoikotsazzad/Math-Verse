import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { getUserMatches } from '../api/users';
import Card from '../components/ui/Card';
import GlowButton from '../components/ui/GlowButton';
import StatPill from '../components/ui/StatPill';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

const StatCard = ({ label, value, sub, accent }) => (
  <div className="glass p-5 flex flex-col gap-1">
    <span className="text-muted text-xs font-medium uppercase tracking-widest">{label}</span>
    <span className={`text-3xl font-heading font-bold ${accent ? 'text-accent' : 'text-white'}`}>{value}</span>
    {sub && <span className="text-muted text-xs">{sub}</span>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentMatches, setRecentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (!user?.username) return;
    getUserMatches(user.username, { limit: 5 })
      .then(res => setRecentMatches(res.data.matches))
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, [user?.username]);

  if (!user) return null;

  const winRate = user.stats?.winRate ?? 0;
  const accuracy = user.stats?.accuracy ?? 0;
  const streak = user.stats?.currentStreak ?? 0;

  return (
    <div className="page-container py-10">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      >
        <Avatar username={user.username} src={user.avatarUrl} size="xl" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-white">{user.username}</h1>
            <Badge color="accent">{user.rank}</Badge>
            {user.stats?.currentStreak > 2 && <Badge color="yellow">🔥 {user.stats.currentStreak} streak</Badge>}
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill label="Rating" value={user.rating} accent />
            <StatPill label="XP" value={`${user.xp.toLocaleString()} XP`} />
            <StatPill label="Wins" value={user.stats?.wins ?? 0} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <GlowButton onClick={() => navigate('/play')} className="text-sm px-6 py-2.5">
            ⚡ Play Now
          </GlowButton>
          <GlowButton variant="outline" onClick={() => navigate(`/profile/${user.username}`)} className="text-sm px-4 py-2.5">
            View Profile
          </GlowButton>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Matches" value={user.stats?.totalMatches ?? 0} />
        <StatCard label="Win Rate" value={`${winRate}%`} accent />
        <StatCard label="Accuracy" value={`${accuracy}%`} />
        <StatCard label="Best Streak" value={user.stats?.bestStreak ?? 0} sub="consecutive wins" />
      </div>

      {/* Quick Modes + Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Play */}
        <div className="lg:col-span-1">
          <h2 className="font-heading font-semibold text-white text-lg mb-4">Quick Play</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Ranked Match', icon: '⚔️', desc: 'Compete for rating', to: '/play?mode=matchmaking', color: 'glow' },
              { label: 'Private Room', icon: '🔐', desc: 'Challenge a friend', to: '/play?mode=private', color: 'outline' },
              { label: 'Daily Challenge', icon: '📅', desc: 'Fresh problems daily', to: '/play?mode=daily', color: 'outline' },
              { label: 'Practice', icon: '🎯', desc: 'No stakes, just reps', to: '/play?mode=practice', color: 'outline' },
            ].map(m => (
              <button
                key={m.label}
                onClick={() => navigate(m.to)}
                className="glass p-4 flex items-center gap-4 hover:border-accent/30 hover:bg-white/8 transition-all duration-200 text-left rounded-xl"
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="font-medium text-white text-sm">{m.label}</div>
                  <div className="text-muted text-xs">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="lg:col-span-2">
          <h2 className="font-heading font-semibold text-white text-lg mb-4">Recent Matches</h2>
          {loadingMatches ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : recentMatches.length === 0 ? (
            <div className="glass p-8 text-center text-muted">
              <div className="text-4xl mb-3">🎮</div>
              <p className="font-medium text-white mb-1">No matches yet</p>
              <p className="text-sm">Play your first match to see history here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentMatches.map(m => (
                <div key={m._id} className="glass p-4 flex items-center gap-4">
                  <div className={`w-1.5 h-12 rounded-full ${m.result === 'win' ? 'bg-accent' : m.result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge color={m.result === 'win' ? 'green' : m.result === 'loss' ? 'red' : 'yellow'}>
                        {m.result.toUpperCase()}
                      </Badge>
                      <span className="text-white text-sm font-medium truncate">
                        vs {m.opponentId?.username || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-muted text-xs mt-1">
                      {m.score} pts · {m.accuracy}% accuracy · +{m.xpEarned} XP
                    </div>
                  </div>
                  <div className="text-muted text-xs shrink-0">
                    {new Date(m.playedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
