import { clsx } from 'clsx';

export const Avatar = ({ src, username = '?', size = 'md', className }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' };
  const initial = username?.[0]?.toUpperCase() || '?';

  if (src) {
    return <img src={src} alt={username} className={clsx('rounded-full object-cover border border-white/10', sizes[size], className)} />;
  }

  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center font-heading font-bold border border-accent/30 bg-accent/10 text-accent',
      sizes[size],
      className
    )}>
      {initial}
    </div>
  );
};

export default Avatar;
