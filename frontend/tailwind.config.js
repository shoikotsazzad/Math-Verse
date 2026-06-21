/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#B6FF4D',
        'accent-dark': '#8FCC30',
        surface: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.1)',
        bg: '#0B0B0B',
        'bg-card': '#111111',
        muted: '#6B6B6B',
        'text-base': '#E5E5E5',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(182, 255, 77, 0.3)',
        'glow-lg': '0 0 40px rgba(182, 255, 77, 0.4)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(182, 255, 77, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(182, 255, 77, 0.6)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
