import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTournaments, registerForTournament } from '../api/tournaments';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import GlowButton from '../components/ui/GlowButton';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const statusColor = { registration: 'blue', active: 'green', completed: 'gray' };

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getTournaments()
      .then(res => setTournaments(res.data.tournaments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (id) => {
    try {
      await registerForTournament(id);
      const res = await getTournaments();
      setTournaments(res.data.tournaments);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="page-container py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">Tournaments</h1>
        <p className="text-muted text-sm">Single-elimination brackets. One champion crowned.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tournaments.length === 0 ? (
        <div className="glass p-16 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <p className="text-white font-medium mb-1">No tournaments yet</p>
          <p className="text-muted text-sm">Check back soon — admins create new tournaments regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t, i) => {
            const isRegistered = t.participants?.some(p => (p._id || p) === user?._id);
            const spotsLeft = t.maxParticipants - (t.participants?.length ?? 0);
            return (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-bold text-white text-lg leading-tight">{t.name}</h3>
                  <Badge color={statusColor[t.status]}>{t.status}</Badge>
                </div>
                {t.description && <p className="text-muted text-sm">{t.description}</p>}
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Participants</span>
                    <span className="text-white">{t.participants?.length ?? 0} / {t.maxParticipants}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Start Date</span>
                    <span className="text-white">{new Date(t.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Prize XP</span>
                    <span className="text-accent font-semibold">+{t.prizeXp} XP</span>
                  </div>
                </div>
                {t.championId && (
                  <div className="text-sm text-yellow-400">
                    🏆 Champion: {t.championId.username}
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <Link to={`/tournaments/${t._id}`} className="flex-1">
                    <GlowButton variant="outline" className="w-full text-sm py-2">View Bracket</GlowButton>
                  </Link>
                  {t.status === 'registration' && !isRegistered && spotsLeft > 0 && (
                    <GlowButton onClick={() => handleRegister(t._id)} className="text-sm py-2 px-4">
                      Register
                    </GlowButton>
                  )}
                  {isRegistered && t.status === 'registration' && (
                    <Badge color="green" className="self-center">Registered</Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentsPage;
