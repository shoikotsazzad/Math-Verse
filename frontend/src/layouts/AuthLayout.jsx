import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4">
    <Link to="/" className="font-heading font-bold text-2xl mb-10">
      Math<span className="text-accent">Verse</span>
    </Link>
    <div className="w-full max-w-md">
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;
