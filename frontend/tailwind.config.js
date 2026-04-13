/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:            '#F8FAFC',
          primarybg:     '#EEF1F9',
          card:          '#FFFFFF',
          secondarybg:   '#FFFFFF',
          surface:       '#FFFFFF',
          border:        '#E2E8F0',
          primary:       '#7D53F6',
          'primary-light': '#9F74F7',
          primarydull:   '#9F74F7',
          sidebar:       '#0F172A',
          green:         '#008000',
          pending:       '#F0B041',
          red:           '#DC2626',
          text:          '#000000',
          primarytext:   '#000000',
          muted:         '#5F6388',
          secondarytext: '#5F6388',
          scroll:        '#D1D1D1',
          scrollHover:   '#9CA3AF',
          skyblue:       '#0388FC',
          gold:          '#F0B041',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
        sans:    ['var(--font-sans)', 'Inter', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card':       '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'brand':      '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
