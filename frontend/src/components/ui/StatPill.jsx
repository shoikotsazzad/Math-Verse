import { clsx } from 'clsx';

export const StatPill = ({ label, value, icon, accent = false, className }) => (
  <div className={clsx(
    'stat-pill',
    accent && 'border-accent/30 text-accent',
    className
  )}>
    {icon && <span>{icon}</span>}
    {label && <span className="text-muted text-xs">{label}</span>}
    <span className={clsx('font-semibold', accent ? 'text-accent' : 'text-white')}>{value}</span>
  </div>
);

export default StatPill;
