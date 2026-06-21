import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as authApi from '../../api/auth';
import Input from '../../components/ui/Input';
import GlowButton from '../../components/ui/GlowButton';
import Card from '../../components/ui/Card';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="p-8">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-heading font-bold mb-2">Check your email</h2>
            <p className="text-muted text-sm mb-6">If that account exists, a reset link is on its way.</p>
            <Link to="/login" className="text-accent hover:underline text-sm">Back to login</Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-heading font-bold text-white mb-2">Reset password</h1>
              <p className="text-muted text-sm">Enter your email and we'll send a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <GlowButton type="submit" disabled={loading} className="w-full justify-center">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </GlowButton>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              <Link to="/login" className="text-accent hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default ForgotPasswordPage;
