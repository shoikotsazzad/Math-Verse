import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProfile, getUserMatches, updateMe } from '../api/users';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import useAuthStore from '../store/authStore';

const RANK_CONFIG = {
  Novice:      { color: '#14b8a6', bg: 'from-teal-900/60',   label: 'NOVICE',       max: 1200 },
  Apprentice:  { color: '#3b82f6', bg: 'from-blue-900/60',   label: 'APPRENTICE',   max: 1400 },
  Expert:      { color: '#8b5cf6', bg: 'from-purple-900/60', label: 'EXPERT',       max: 1600 },
  Master:      { color: '#ec4899', bg: 'from-pink-900/60',   label: 'MASTER',       max: 1800 },
  Grandmaster: { color: '#ef4444', bg: 'from-red-900/60',    label: 'GRANDMASTER',  max: 2100 },
};

const CATEGORIES = [
  { id: 'math',   label: 'MATH',   key: 'mathRating',   icon: '⚡', color: '#facc15' },
  { id: 'logic',  label: 'LOGIC',  key: 'logicRating',  icon: '💡', color: '#f472b6' },
  { id: 'memory', label: 'MEMORY', key: 'memoryRating', icon: '🧠', color: '#60a5fa' },
  { id: 'puzzle', label: 'PUZZLE', key: 'puzzleRating', icon: '🧩', color: '#B6FF4D' },
];

const XPChart = ({ data = [0, 0, 0, 0, 0, 0, 0] }) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const max = Math.max(...data, 1);
  const W = 400, H = 90, PAD = 12;
  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <div className="space-y-2">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B6FF4D" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#B6FF4D" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PAD} y1={H - PAD - f * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)}
            stroke="white" strokeOpacity={0.05} strokeWidth={1} />
        ))}
        <path d={area} fill="url(#xpGrad)" />
        <path d={path} fill="none" stroke="#B6FF4D" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#B6FF4D" />
        ))}
      </svg>
      <div className="flex justify-between px-1">
        {days.map(d => <span key={d} className="text-[10px] text-muted">{d}</span>)}
      </div>
    </div>
  );
};

const RankBadge = ({ rank, rating, max }) => {
  const cfg = RANK_CONFIG[rank] || RANK_CONFIG.Novice;
  const pct = Math.min(100, Math.round((rating / max) * 100));
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="72" height="68" viewBox="0 0 80 76">
        <polygon points="40,2 78,28 66,70 14,70 2,28" fill={cfg.color + '22'} stroke={cfg.color} strokeWidth="2.5" />
        <text x="40" y="46" textAnchor="middle" fill={cfg.color} fontSize="22" fontWeight="bold">◆</text>
      </svg>
      <span className="font-heading font-bold text-sm tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
      <div className="w-full space-y-1">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: cfg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted">RANK RATING</span>
          <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{rating} / {max}</span>
        </div>
      </div>
    </div>
  );
};

const resizeImageToBase64 = (file, size = 160) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Centre-crop
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ProfilePage = () => {
  const { username } = useParams();
  const { user: me, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRankCat, setActiveRankCat] = useState('math');
  const [activeGameCat, setActiveGameCat] = useState('all');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProfile(username), getUserMatches(username, { limit: 10 })])
      .then(([pr, mr]) => {
        setProfile(pr.data.user);
        setMatches(mr.data.matches || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-muted">User not found</p>
      </div>
    </div>
  );

  const rank = profile.rank || 'Novice';
  const rankCfg = RANK_CONFIG[rank] || RANK_CONFIG.Novice;
  const isMe = me?.username === username;

  const handleAvatarClick = () => {
    if (!isMe) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    try {
      const base64 = await resizeImageToBase64(file, 160);
      await updateMe({ avatarUrl: base64 });
      setProfile(prev => ({ ...prev, avatarUrl: base64 }));
      // Update auth store so navbar avatar refreshes immediately
      updateUser({ avatarUrl: base64 });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeCatData = CATEGORIES.find(c => c.id === activeRankCat) || CATEGORIES[0];
  const activeCatRating = profile[activeCatData.key] || 1000;
  const weeklyXP = [0, 0, 0, 0, Math.min(profile.xp || 0, 500), 0, 0];

  const filteredMatches = activeGameCat === 'all' ? matches : matches.filter(m => m.category === activeGameCat);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">

      {/* ── Rank Banner (full-width) ── */}
      <div
        className={`relative h-44 overflow-hidden bg-gradient-to-br ${rankCfg.bg} to-[#0B0B0B]`}
        style={{ background: `linear-gradient(135deg, ${rankCfg.color}33 0%, #0B0B0B 70%)` }}
      >
        {/* diagonal stripe pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${rankCfg.color} 0px, ${rankCfg.color} 1px, transparent 1px, transparent 14px)`,
        }} />
        {/* watermark rank text */}
        <span className="absolute bottom-3 right-6 font-heading font-black text-6xl tracking-widest opacity-10 select-none"
          style={{ color: rankCfg.color }}>
          {rankCfg.label}
        </span>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
        >
          ←
        </button>
      </div>

      {/* ── Two-column content ── */}
      <div className="page-container pb-16">
        <div className="grid lg:grid-cols-3 gap-8 -mt-12 relative">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar card */}
            <div className="glass rounded-2xl p-6 pt-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <div className="flex items-end gap-4 mb-4">
                {/* Avatar with upload overlay */}
                <div
                  className={`relative shrink-0 ${isMe ? 'cursor-pointer group' : ''}`}
                  onClick={handleAvatarClick}
                  title={isMe ? 'Change photo' : undefined}
                >
                  {avatarUploading ? (
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <Avatar username={profile.username} src={profile.avatarUrl} size="xl"
                      className="ring-4 ring-[#0B0B0B]" />
                  )}
                  {isMe && !avatarUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-lg">📷</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: rankCfg.color, color: '#000' }}>◆</div>
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading font-bold text-xl text-white leading-tight">{profile.username}</h1>
                  <p className="text-muted text-sm">@{profile.username}</p>
                  <p className="text-accent text-xs mt-0.5 font-medium">{profile.stats?.totalMatches || 0} games played</p>
                  {isMe && (
                    <button
                      onClick={handleAvatarClick}
                      className="text-[11px] text-muted hover:text-accent transition-colors mt-1"
                    >
                      Change photo
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isMe ? (
                  <button onClick={() => navigate('/settings')}
                    className="flex-1 text-xs py-2 px-4 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all font-medium">
                    Edit Profile
                  </button>
                ) : (
                  <button className="flex-1 text-xs py-2 px-4 rounded-xl bg-accent text-black font-bold hover:bg-accent/90 transition-all">
                    Add Friend
                  </button>
                )}
                <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white transition-all">
                  ↗
                </button>
              </div>
            </div>

            {/* Per-Category Ratings */}
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-bold tracking-widest text-muted uppercase mb-3">Ratings</div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveRankCat(cat.id)}
                    className={`rounded-xl p-3 text-center border transition-all ${
                      activeRankCat === cat.id
                        ? 'border-white/25 bg-white/8'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon}</div>
                    <div className="font-heading font-black text-lg text-white leading-none">{profile[cat.key] || 1000}</div>
                    <div className="text-[9px] text-muted mt-1">{cat.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Rank Badge */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-widest text-muted uppercase">{activeCatData.label} Rank</span>
              </div>
              <RankBadge rank={rank} rating={activeCatRating} max={rankCfg.max} />
            </div>

            {/* Stats Overview */}
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-bold tracking-widest text-muted uppercase mb-3">Stats</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Max Streak', value: profile.stats?.bestStreak || 0,        icon: '🔥', color: '#f97316' },
                  { label: 'Total XP',   value: (profile.xp || 0).toLocaleString(),    icon: '⚡', color: '#B6FF4D' },
                  { label: 'League',     value: profile.league || 'Bronze',             icon: '🏅', color: '#a78bfa' },
                  { label: 'Games',      value: profile.stats?.totalMatches || 0,       icon: '🎮', color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-heading font-bold text-base text-white truncate">{s.value}</div>
                      <div className="text-[10px] text-muted mt-0.5 truncate">{s.label}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: s.color + '22' }}>
                      {s.icon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right main content ── */}
          <div className="lg:col-span-2 space-y-5 lg:pt-16">

            {/* Weekly XP Chart */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-white">XP This Week</div>
                <div className="text-accent text-xs font-bold">{profile.xp || 0} total XP</div>
              </div>
              <XPChart data={weeklyXP} />
            </div>

            {/* Last Games */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white">Recent Games</span>
                <span className="text-xs text-muted">{matches.length} total</span>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                {[{ id: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveGameCat(cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeGameCat === cat.id
                        ? 'bg-white/12 text-white border border-white/20'
                        : 'text-muted hover:text-white'
                    }`}
                  >
                    {cat.label || 'All'}
                  </button>
                ))}
              </div>

              {filteredMatches.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-3">🎮</div>
                  <p className="text-muted text-sm">No games yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.slice(0, 5).map((match, i) => {
                    const isWin = match.result === 'win' || (match.winnerId && match.winnerId.toString() === profile._id?.toString());
                    const ratingChange = match.ratingChange || 10;
                    return (
                      <div key={match._id || i} className="rounded-xl bg-white/3 border border-white/8 p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] text-muted tracking-widest uppercase">
                            {match.category?.toUpperCase() || 'MATH'} · SPRINT DUELS ·{' '}
                            {match.playedAt ? new Date(match.playedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '—'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isWin ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'
                          }`}>{isWin ? 'WIN' : 'LOSS'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar username={profile.username} src={profile.avatarUrl} size="xs" />
                            <div>
                              <div className="text-sm font-medium text-white">{profile.username}</div>
                              <div className={`text-xs ${isWin ? 'text-accent' : 'text-red-400'}`}>
                                {isWin ? `+${ratingChange}` : `-${ratingChange}`} rating
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-heading font-black text-white">{match.score ?? '—'}</div>
                        </div>
                        {match.opponentId && (
                          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs">👤</div>
                              <div>
                                <div className={`text-sm font-medium ${!isWin ? 'text-white' : 'text-muted'}`}>
                                  {match.opponentId?.username || 'Opponent'}
                                </div>
                                <div className={`text-xs ${!isWin ? 'text-accent' : 'text-red-400'}`}>
                                  {!isWin ? `+${ratingChange}` : `-${ratingChange}`} rating
                                </div>
                              </div>
                            </div>
                            <div className={`text-2xl font-heading font-black ${!isWin ? 'text-white' : 'text-muted'}`}>
                              {match.opponentScore ?? '—'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
