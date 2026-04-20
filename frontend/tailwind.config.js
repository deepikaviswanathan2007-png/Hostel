/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1A3C6E',
          primaryLight: '#2B5BA8',
          accent: '#0078D4',
          bg: '#F4F6F9',
          surface: '#FFFFFF',
          border: '#DDE3ED',
          text: '#1C2B3A',
          muted: '#6B7A90',
          success: '#0D7A4A',
          warning: '#C27A00',
          danger: '#B91C1C',
          sidebar: '#1A3C6E',
          sidebarText: '#FFFFFF',
          sidebarMuted: 'rgba(255,255,255,0.55)',
          sidebarActive: 'rgba(255,255,255,0.15)',
          // Legacy aliases for compatibility
          primarybg: '#F4F6F9',
          card: '#FFFFFF',
          secondarybg: '#FFFFFF',
          'primary-light': '#2B5BA8',
          primarydull: '#2B5BA8',
          green: '#0D7A4A',
          pending: '#C27A00',
          red: '#B91C1C',
          primarytext: '#1C2B3A',
          secondarytext: '#6B7A90',
          scroll: '#DDE3ED',
          scrollHover: '#AAB2C5',
          skyblue: '#0078D4',
          gold: '#C27A00',
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
