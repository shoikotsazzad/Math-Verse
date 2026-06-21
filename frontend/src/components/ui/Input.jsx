import { clsx } from 'clsx';

export const Input = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm text-text-base font-medium">{label}</label>}
    <input
      className={clsx(
        'input-field',
        error && 'border-red-500/50 focus:border-red-500',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);

export default Input;
