import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import useGameStore from '../store/gameStore';
import GlowButton from '../components/ui/GlowButton';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';

const MODES = [
  { id: 'matchmaking', icon: '⚔️', label: 'Ranked Match', desc: 'Get matched with a player at your skill level. Rating is on the line.' },
  { id: 'private', icon: '🔐', label: 'Private Room', desc: 'Create or join a room with a code. Challenge whoever you want.' },
  { id: 'daily', icon: '📅', label: 'Daily Challenge', desc: 'Ten fresh problems. One attempt. Climb today\'s leaderboard.' },
  { id: 'practice', icon: '🎯', label: 'Practice', desc: 'No opponents, no rating change. Just you and the problems.' },
];

const PlayPage = () => {
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(searchParams.get('mode') || null);
  const [queuing, setQueuing] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { setStatus, setRoom } = useGameStore();

  const handleMatchmaking = () => {
    if (!socket) return;
    setQueuing(true);
    setStatus('queuing');
    socket.emit('queue:join', { mode: 'matchmaking' });

    socket.once('queue:matched', ({ roomId, roomCode: rc, opponent }) => {
      setQueuing(false);
      setRoom(roomId, rc, opponent);
      navigate(`/match/${roomId}`);
    });
  };

  const cancelQueue = () => {
    if (!socket) return;
    socket.emit('queue:leave');
    setQueuing(false);
    setStatus('idle');
  };

  const handleCreatePrivate = () => {
    if (!socket) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    socket.emit('room:join', { roomCode: code });
    socket.once('room:joined', ({ room }) => {
      setRoom(room._id, code, null);
      navigate(`/match/${room._id}`);
    });
  };

  const handleJoinPrivate = () => {
    if (!socket || !roomCode.trim()) return;
    setJoining(true);
    socket.emit('room:join', { roomCode: roomCode.trim().toUpperCase() });
    socket.once('room:joined', ({ room, opponent }) => {
      setRoom(room._id, roomCode.trim().toUpperCase(), opponent);
      navigate(`/match/${room._id}`);
    });
    socket.once('error', (err) => {
      setJoining(false);
      alert(err.message || 'Failed to join room');
    });
  };

  const handleDaily = () => navigate('/play/daily');
  const handlePractice = () => navigate('/play/practice');

  return (
    <div className="page-container py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Choose Your Mode</h1>
        <p className="text-muted">Pick how you want to play today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {MODES.map(m => (
          <motion.button
            key={m.id}
            onClick={() => setSelected(m.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`glass p-6 text-left transition-all duration-200 rounded-xl ${
              selected === m.id ? 'border-accent/50 bg-accent/5' : 'hover:border-white/20'
            }`}
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <h3 className="font-heading font-semibold text-white text-lg mb-1">{m.label}</h3>
            <p className="text-muted text-sm">{m.desc}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected === 'matchmaking' && (
          <motion.div
            key="matchmaking"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass p-8 max-w-md"
          >
            {queuing ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <Spinner size="lg" />
                <div className="text-center">
                  <p className="text-white font-semibold text-lg mb-1">Finding your opponent...</p>
                  <p className="text-muted text-sm">Matching by skill rating. Usually under 10 seconds.</p>
                </div>
                <GlowButton variant="outline" onClick={cancelQueue}>Cancel</GlowButton>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="font-heading font-bold text-white text-xl">Ready to compete?</h3>
                <p className="text-muted text-sm">You'll be matched with someone near your skill level. Rating changes on every match.</p>
                <GlowButton onClick={handleMatchmaking}>Enter Queue</GlowButton>
              </div>
            )}
          </motion.div>
        )}

        {selected === 'private' && (
          <motion.div
            key="private"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass p-8 max-w-md flex flex-col gap-6"
          >
            <div>
              <h3 className="font-heading font-bold text-white text-lg mb-4">Create a Room</h3>
              <GlowButton onClick={handleCreatePrivate}>Create Room & Copy Code</GlowButton>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h3 className="font-heading font-bold text-white text-lg mb-4">Join a Room</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <GlowButton onClick={handleJoinPrivate} disabled={joining || !roomCode.trim()}>
                  {joining ? '...' : 'Join'}
                </GlowButton>
              </div>
            </div>
          </motion.div>
        )}

        {selected === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass p-8 max-w-md"
          >
            <h3 className="font-heading font-bold text-white text-xl mb-2">Daily Challenge</h3>
            <p className="text-muted text-sm mb-6">10 questions, one attempt per day. The reset happens at midnight UTC.</p>
            <GlowButton onClick={handleDaily}>Start Daily Challenge</GlowButton>
          </motion.div>
        )}

        {selected === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass p-8 max-w-md"
          >
            <h3 className="font-heading font-bold text-white text-xl mb-2">Practice Mode</h3>
            <p className="text-muted text-sm mb-6">No opponents, no rating. Perfect for warming up or working on weak spots.</p>
            <GlowButton onClick={handlePractice}>Start Practice</GlowButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayPage;
