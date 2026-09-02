import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f6',
          100: '#d7deea',
          200: '#aebccb',
          300: '#8497ad',
          400: '#5a6f8e',
          500: '#3a5170',
          600: '#243a56',
          700: '#182a41', // primary dark navy
          800: '#101d2e',
          900: '#08111a',
        },
        accent: {
          100: '#ffe8c2',
          200: '#ffd699',
          400: '#ffb648',
          500: '#f7941d', // primary orange accent
          600: '#dd7a05',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f6f8',
          border: '#e2e6eb',
        },
      },
      fontFamily: {
        // Часть редизайна — var(--font-inter) задаётся в app/layout.tsx через
        // next/font/google, системный стек остаётся как fallback.
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 29, 46, 0.06), 0 1px 6px rgba(16, 29, 46, 0.06)',
        soft: '0 2px 8px rgba(16, 29, 46, 0.05)',
        lift: '0 16px 40px -12px rgba(16, 29, 46, 0.18)',
        glow: '0 0 0 1px rgba(247, 148, 29, 0.15), 0 12px 32px -8px rgba(247, 148, 29, 0.25)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgba(8,17,26,1)), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 48px)',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
