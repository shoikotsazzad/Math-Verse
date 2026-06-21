import { clsx } from 'clsx';

const colors = {
  accent: 'bg-accent/15 text-accent border-accent/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  gray: 'bg-white/5 text-muted border-white/10',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
};

export const Badge = ({ children, color = 'accent', className }) => (
  <span className={clsx('inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color], className)}>
    {children}
  </span>
);

export default Badge;
