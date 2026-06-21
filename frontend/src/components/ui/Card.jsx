import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export const Card = ({ children, className, hover = false, ...props }) => (
  <motion.div
    className={clsx('glass p-6', hover && 'hover:border-white/20 hover:bg-white/8 transition-all duration-200 cursor-pointer', className)}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    {...props}
  >
    {children}
  </motion.div>
);

export default Card;
