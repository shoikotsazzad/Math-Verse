import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLeaderboard } from '../api/leaderboard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const PERIODS = ['global', 'weekly', 'monthly'];

const LeaderboardPage = () => {
  const [period, setPeriod] = useState('global');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period)
      .then(res => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const rankColor = (i) => {
    if (i === 0) return 'text-yellow-400';
    if (i === 1) return 'text-gray-300';
    if (i === 2) return 'text-amber-600';
    return 'text-muted';
  };

  return (
    <div className="page-container py-12">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Leaderboard</h1>
          <p className="text-muted text-sm">The world's top mental math competitors, ranked.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                period === p ? 'bg-accent text-black' : 'glass text-muted hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-white font-medium mb-1">No rankings yet</p>
          <p className="text-muted text-sm">Be the first to complete a match this {period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'time'}.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Top 3 podium */}
          {users.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-3 gap-px border-b border-white/10">
              {[users[1], users[0], users[2]].map((u, visualIdx) => {
                if (!u) return <div key={visualIdx} />;
                const rank = users.indexOf(u);
                const heights = ['h-24', 'h-32', 'h-20'];
                return (
                  <div key={u.userId || u._id} className={`flex flex-col items-center justify-end pb-6 pt-4 ${visualIdx === 1 ? 'bg-accent/5' : ''}`}>
                    <Avatar username={u.username} size="md" className="mb-2" />
                    <Link to={`/profile/${u.username}`} className="text-white font-medium text-sm hover:text-accent">{u.username}</Link>
                    <span className={`font-heading font-bold text-2xl ${rankColor(rank)} mt-1`}>{rank + 1}</span>
                    <span className="text-muted text-xs">{period === 'global' ? u.rating : u.wins + 'W'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          {users.map((u, i) => (
            <motion.div
              key={u.userId || u._id || u.username}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <span className={`w-8 text-center font-heading font-bold text-sm ${rankColor(i)}`}>
                {i + 1}
              </span>
              <Avatar username={u.username} src={u.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${u.username}`} className="font-medium text-white text-sm hover:text-accent transition-colors block truncate">
                  {u.username}
                </Link>
                <span className="text-muted text-xs">{u.rank}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {period === 'global' ? (
                  <>
                    <span className="text-accent font-heading font-bold">{u.rating}</span>
                    <span className="text-muted text-sm hidden sm:block">{u['stats.wins'] ?? u.wins ?? 0}W</span>
                  </>
                ) : (
                  <>
                    <span className="text-accent font-heading font-bold">{u.wins}W</span>
                    <span className="text-muted text-sm hidden sm:block">+{u.totalXp} XP</span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
