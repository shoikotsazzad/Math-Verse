import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import GlowButton from '../../components/ui/GlowButton';
import Card from '../../components/ui/Card';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-heading font-bold text-white mb-2">Welcome back</h1>
          <p className="text-muted text-sm">Ready to dominate the leaderboard?</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <GlowButton type="submit" disabled={loading} className="w-full justify-center mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </GlowButton>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-muted hover:text-accent transition-colors block">
            Forgot password?
          </Link>
          <p className="text-sm text-muted">
            No account?{' '}
            <Link to="/register" className="text-accent hover:underline">Create one</Link>
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoginPage;
