import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { updateMe } from '../api/users';
import Input from '../components/ui/Input';
import GlowButton from '../components/ui/GlowButton';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ username: user?.username || '', avatarUrl: user?.avatarUrl || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await updateMe(form);
      updateUser(res.data.user);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container py-12 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold text-white mb-8">Settings</h1>

      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar username={user?.username} src={form.avatarUrl || user?.avatarUrl} size="xl" />
          <div>
            <div className="font-semibold text-white">{user?.username}</div>
            <div className="text-muted text-sm">{user?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input
            label="Username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="Your username"
          />
          <Input
            label="Avatar URL"
            value={form.avatarUrl}
            onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
            placeholder="https://..."
          />

          {success && (
            <div className="bg-accent/10 border border-accent/20 text-accent text-sm px-4 py-3 rounded-lg">
              Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <GlowButton type="submit" disabled={loading} className="self-start">
            {loading ? 'Saving...' : 'Save Changes'}
          </GlowButton>
        </form>
      </Card>

      <Card className="p-8 mt-6">
        <h2 className="font-heading font-semibold text-white text-lg mb-4">Account</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Email</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Role</span>
            <span className="text-white capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Member since</span>
            <span className="text-white">{new Date(user?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
