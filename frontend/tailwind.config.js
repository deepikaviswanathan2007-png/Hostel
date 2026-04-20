/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#EEF1F9',
          primarybg: '#EEF1F9',
          card: '#FFFFFF',
          secondarybg: '#FFFFFF',
          surface: '#FFFFFF',
          border: '#D8DCF0',
          primary: '#7D53F6',
          'primary-light': '#9F74F7',
          primarydull: '#9F74F7',
          sidebar: '#FFFFFF',
          green: '#008000',
          pending: '#F0B041',
          red: '#DC2626',
          text: '#0F172A',
          primarytext: '#000000',
          muted: '#5F6388',
          secondarytext: '#5F6388',
          scroll: '#D1D1D1',
          scrollHover: '#9CA3AF',
          skyblue: '#0388FC',
          gold: '#F0B041',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 8px 22px -12px rgba(15, 23, 42, 0.32), 0 2px 6px -2px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 18px 34px -16px rgba(15, 23, 42, 0.34), 0 8px 12px -8px rgba(15, 23, 42, 0.10)',
        brand: '0 12px 30px -14px rgba(125, 83, 246, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
