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
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 29, 46, 0.06), 0 1px 6px rgba(16, 29, 46, 0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
