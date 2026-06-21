import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTournament, registerForTournament, startTournament } from '../api/tournaments';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import GlowButton from '../components/ui/GlowButton';
import Spinner from '../components/ui/Spinner';

const statusColor = { registration: 'blue', active: 'green', completed: 'gray' };

const TournamentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getTournament(id)
      .then(res => setTournament(res.data.tournament))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleRegister = async () => {
    try {
      await registerForTournament(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleStart = async () => {
    try {
      await startTournament(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!tournament) return <div className="page-container py-20 text-center text-muted">Tournament not found.</div>;

  const isRegistered = tournament.participants?.some(p => p._id === user?._id || p === user?._id);

  return (
    <div className="page-container py-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-white">{tournament.name}</h1>
            <Badge color={statusColor[tournament.status]}>{tournament.status}</Badge>
          </div>
          {tournament.description && <p className="text-muted">{tournament.description}</p>}
        </div>
        <div className="flex gap-3 shrink-0">
          {tournament.status === 'registration' && !isRegistered && (
            <GlowButton onClick={handleRegister}>Register</GlowButton>
          )}
          {tournament.status === 'registration' && user?.role === 'admin' && (
            <GlowButton variant="outline" onClick={handleStart}>Start Tournament</GlowButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div>
          <h2 className="font-heading font-semibold text-white text-lg mb-4">Details</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Start Date', value: new Date(tournament.startDate).toLocaleDateString() },
              { label: 'Prize XP', value: `+${tournament.prizeXp} XP`, accent: true },
              { label: 'Participants', value: `${tournament.participants?.length ?? 0} / ${tournament.maxParticipants}` },
            ].map(s => (
              <div key={s.label} className="glass p-4 flex justify-between items-center">
                <span className="text-muted text-sm">{s.label}</span>
                <span className={s.accent ? 'text-accent font-semibold' : 'text-white'}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Champion */}
          {tournament.championId && (
            <div className="mt-6 glass p-4 text-center border-yellow-500/30">
              <div className="text-yellow-400 text-2xl mb-2">🏆</div>
              <div className="text-white font-semibold">{tournament.championId.username}</div>
              <div className="text-muted text-xs">Champion</div>
            </div>
          )}

          {/* Participants */}
          <div className="mt-6">
            <h3 className="font-heading font-semibold text-white mb-3">Participants ({tournament.participants?.length})</h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {tournament.participants?.map(p => (
                <div key={p._id || p} className="flex items-center gap-3 glass p-3">
                  <Avatar username={p.username || '?'} size="sm" />
                  <Link to={`/profile/${p.username}`} className="text-white text-sm hover:text-accent">{p.username}</Link>
                  {isRegistered && <span className="text-xs text-accent ml-auto">You</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bracket */}
        <div className="lg:col-span-2">
          <h2 className="font-heading font-semibold text-white text-lg mb-4">Bracket</h2>
          {tournament.bracket?.length === 0 || !tournament.bracket ? (
            <div className="glass p-12 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-white font-medium mb-1">Bracket not generated yet</p>
              <p className="text-muted text-sm">
                {tournament.status === 'registration' ? 'Registration is open. Bracket will be drawn when the tournament starts.' : 'No bracket data available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max">
                {tournament.bracket.map(round => (
                  <div key={round.round} className="flex flex-col gap-4 min-w-[180px]">
                    <div className="text-muted text-xs font-medium text-center">Round {round.round}</div>
                    {round.matches.map((match, mi) => (
                      <div key={mi} className="glass p-3 flex flex-col gap-2">
                        {[match.player1, match.player2].map((player, pi) => (
                          <div key={pi} className={`flex items-center gap-2 p-2 rounded-lg ${match.winner?._id === player?._id || match.winner === player ? 'bg-accent/10 border border-accent/20' : ''}`}>
                            <Avatar username={player?.username || (match.isBye && pi === 1 ? 'BYE' : '?')} size="sm" />
                            <span className="text-sm text-white truncate">
                              {player?.username || (match.isBye && pi === 1 ? 'BYE' : 'TBD')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
