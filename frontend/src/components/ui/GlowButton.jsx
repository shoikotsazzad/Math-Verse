import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export const GlowButton = ({ children, variant = 'primary', className, disabled, ...props }) => {
  const base = 'font-heading font-semibold rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  const variants = {
    primary: 'bg-accent text-black px-6 py-3 hover:bg-accent-dark hover:shadow-glow animate-glow-pulse',
    outline: 'border border-accent/60 text-accent px-6 py-3 hover:bg-accent/10',
    ghost: 'text-text-base px-4 py-2 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-3 hover:bg-red-500/30',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={clsx(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default GlowButton;
