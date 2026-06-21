import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-white/10 bg-white/[0.01] mt-auto">
    <div className="page-container py-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="font-heading font-bold text-xl text-white">Math<span className="text-accent">Verse</span></span>
          </Link>
          <p className="text-muted text-sm leading-relaxed mb-5">
            The competitive mental math arena. Battle real opponents, climb the ranks, and prove your mind.
          </p>
          <div className="flex gap-3">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted hover:text-white hover:border-white/20 transition-all">
              𝕏
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted hover:text-white hover:border-white/20 transition-all text-sm">
              💬
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted hover:text-white hover:border-white/20 transition-all text-sm">
              ⌥
            </a>
          </div>
        </div>

        {/* Play */}
        <div>
          <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">Play</h4>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: 'Ranked Matches', to: '/register' },
              { label: 'Tournaments', to: '/tournaments' },
              { label: 'Daily Challenge', to: '/register' },
              { label: 'Practice Mode', to: '/register' },
              { label: 'Leaderboard', to: '/leaderboard' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to} className="text-muted text-sm hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Learn */}
        <div>
          <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">Learn</h4>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: 'Features', to: '/#features' },
              { label: 'How It Works', to: '/#how-it-works' },
              { label: 'FAQ', to: '/#faq' },
              { label: 'Ranking System', to: '/#faq' },
              { label: 'Game Modes', to: '/#features' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to} className="text-muted text-sm hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div>
          <h4 className="font-heading font-semibold text-white text-sm mb-4 uppercase tracking-wider">By the numbers</h4>
          <ul className="flex flex-col gap-3">
            {[
              { label: 'Active Players', value: '12,400+' },
              { label: 'Matches Today', value: '8,200+' },
              { label: 'Questions Answered', value: '2.1M+' },
              { label: 'Tournaments Held', value: '340+' },
            ].map(s => (
              <li key={s.label} className="flex justify-between text-sm">
                <span className="text-muted">{s.label}</span>
                <span className="text-accent font-heading font-semibold">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-muted text-xs">© 2026 MathVerse. All rights reserved.</span>
        <div className="flex gap-5">
          <Link to="/register" className="text-muted text-xs hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/register" className="text-muted text-xs hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/register" className="text-muted text-xs hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
