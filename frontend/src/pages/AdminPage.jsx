import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminGetUsers, adminBanUser, adminGetAnalytics, adminGetReports, getQuestions, createQuestion, deleteQuestion } from '../api/admin';
import { createTournament } from '../api/tournaments';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import GlowButton from '../components/ui/GlowButton';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';

const TABS = ['Analytics', 'Users', 'Questions', 'Tournaments'];

const AdminPage = () => {
  const [tab, setTab] = useState('Analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [newQ, setNewQ] = useState({ type: 'addition', difficulty: 'easy', prompt: '', options: '', correctAnswer: '' });
  const [newT, setNewT] = useState({ name: '', startDate: '', maxParticipants: 16, prizeXp: 500 });

  useEffect(() => {
    if (tab === 'Analytics') {
      adminGetAnalytics().then(r => setAnalytics(r.data)).finally(() => setLoading(false));
    } else if (tab === 'Users') {
      setLoading(true);
      adminGetUsers({ search, page: 1, limit: 30 }).then(r => setUsers(r.data.users)).finally(() => setLoading(false));
    } else if (tab === 'Questions') {
      setLoading(true);
      getQuestions({ limit: 50 }).then(r => setQuestions(r.data.questions)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab, search]);

  const handleBan = async (id, ban) => {
    await adminBanUser(id, ban);
    setUsers(us => us.map(u => u._id === id ? { ...u, isBanned: ban } : u));
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    const opts = newQ.options ? newQ.options.split(',').map(o => o.trim()) : [];
    await createQuestion({ ...newQ, options: opts });
    const r = await getQuestions({ limit: 50 });
    setQuestions(r.data.questions);
    setNewQ({ type: 'addition', difficulty: 'easy', prompt: '', options: '', correctAnswer: '' });
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
    setQuestions(qs => qs.filter(q => q._id !== id));
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    await createTournament(newT);
    setNewT({ name: '', startDate: '', maxParticipants: 16, prizeXp: 500 });
    alert('Tournament created!');
  };

  return (
    <div className="page-container py-12">
      <h1 className="text-3xl font-heading font-bold text-white mb-8">Admin Panel</h1>

      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {tab === 'Analytics' && analytics && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: analytics.totalUsers },
                  { label: 'Total Matches', value: analytics.totalMatches },
                  { label: 'Banned Users', value: analytics.bannedUsers },
                  { label: 'Matches This Week', value: analytics.recentMatches },
                ].map(s => (
                  <div key={s.label} className="glass p-5">
                    <div className="text-muted text-xs mb-1">{s.label}</div>
                    <div className="text-3xl font-heading font-bold text-white">{s.value}</div>
                  </div>
                ))}
              </div>
              <h2 className="font-heading font-semibold text-white text-lg mb-4">Top Players</h2>
              <div className="flex flex-col gap-2">
                {analytics.topUsers?.map((u, i) => (
                  <div key={u._id} className="glass p-4 flex items-center gap-4">
                    <span className="text-muted w-6 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-white font-medium">{u.username}</span>
                    </div>
                    <span className="text-accent font-heading font-bold">{u.rating}</span>
                    <span className="text-muted text-sm">{u.stats?.wins ?? 0}W</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Users' && (
            <div>
              <div className="mb-6 max-w-sm">
                <Input placeholder="Search by username or email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                {users.map(u => (
                  <div key={u._id} className="glass p-4 flex items-center gap-4">
                    <Avatar username={u.username} src={u.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium">{u.username}</div>
                      <div className="text-muted text-xs">{u.email}</div>
                    </div>
                    <Badge color={u.role === 'admin' ? 'accent' : 'gray'}>{u.role}</Badge>
                    {u.isBanned && <Badge color="red">Banned</Badge>}
                    <GlowButton
                      variant={u.isBanned ? 'outline' : 'danger'}
                      onClick={() => handleBan(u._id, !u.isBanned)}
                      className="text-xs px-3 py-1.5"
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </GlowButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="font-heading font-semibold text-white text-lg mb-4">Add Question</h2>
                <Card className="p-6">
                  <form onSubmit={handleCreateQuestion} className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <select
                        value={newQ.type}
                        onChange={e => setNewQ(q => ({ ...q, type: e.target.value }))}
                        className="input-field flex-1"
                      >
                        {['addition','subtraction','multiplication','division','percentage','sequence','logic','pattern','memory'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select
                        value={newQ.difficulty}
                        onChange={e => setNewQ(q => ({ ...q, difficulty: e.target.value }))}
                        className="input-field"
                      >
                        {['easy','medium','hard'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <Input label="Prompt (the question)" value={newQ.prompt} onChange={e => setNewQ(q => ({ ...q, prompt: e.target.value }))} required placeholder="e.g. 12 × 13 = ?" />
                    <Input label="Options (comma-separated, leave blank for open answer)" value={newQ.options} onChange={e => setNewQ(q => ({ ...q, options: e.target.value }))} placeholder="156, 144, 169, 132" />
                    <Input label="Correct Answer" value={newQ.correctAnswer} onChange={e => setNewQ(q => ({ ...q, correctAnswer: e.target.value }))} required placeholder="156" />
                    <GlowButton type="submit">Add Question</GlowButton>
                  </form>
                </Card>
              </div>
              <div>
                <h2 className="font-heading font-semibold text-white text-lg mb-4">Questions ({questions.length})</h2>
                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
                  {questions.map(q => (
                    <div key={q._id} className="glass p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{q.prompt}</div>
                        <div className="text-muted text-xs mt-1">
                          {q.type} · {q.difficulty} · Answer: {q.correctAnswer}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="text-red-400 hover:text-red-300 text-xs shrink-0 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {questions.length === 0 && <p className="text-muted text-sm text-center py-8">No questions yet. Add some above!</p>}
                </div>
              </div>
            </div>
          )}

          {tab === 'Tournaments' && (
            <div className="max-w-lg">
              <h2 className="font-heading font-semibold text-white text-lg mb-4">Create Tournament</h2>
              <Card className="p-6">
                <form onSubmit={handleCreateTournament} className="flex flex-col gap-4">
                  <Input label="Tournament Name" value={newT.name} onChange={e => setNewT(t => ({ ...t, name: e.target.value }))} required placeholder="Spring Invitational 2026" />
                  <Input label="Start Date" type="datetime-local" value={newT.startDate} onChange={e => setNewT(t => ({ ...t, startDate: e.target.value }))} required />
                  <Input label="Max Participants" type="number" min={2} max={64} value={newT.maxParticipants} onChange={e => setNewT(t => ({ ...t, maxParticipants: parseInt(e.target.value) }))} />
                  <Input label="Prize XP" type="number" value={newT.prizeXp} onChange={e => setNewT(t => ({ ...t, prizeXp: parseInt(e.target.value) }))} />
                  <GlowButton type="submit">Create Tournament</GlowButton>
                </form>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage;
