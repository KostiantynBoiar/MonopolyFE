import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10182E',
        navy: {
          DEFAULT: '#0C1730',
          700: '#15244A',
        },
        blue: {
          DEFAULT: '#1E47B0',
          600: '#2B57C6',
          50: '#EEF2FB',
        },
        gold: {
          DEFAULT: '#C6951C',
          600: '#B0820F',
          50: '#F6EECF',
        },
        paper: '#FAF9F6',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E6E3DB',
          2: '#D4D0C4',
        },
        muted: '#5C6378',
        green: '#1E7A52',
        red: '#BD423A',
        band: {
          brown: '#6B4A2E',
          cyan: '#8FC9DC',
          pink: '#C24C8B',
          orange: '#D9802C',
          red: '#C53A33',
          yellow: '#DDAE1A',
          green: '#2E7D4F',
          blue: '#2B57C6',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-hanken)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16,24,46,.06), 0 1px 3px rgba(16,24,46,.07)',
        md: '0 6px 18px rgba(16,24,46,.08)',
        lg: '0 22px 48px rgba(16,24,46,.12)',
      },
      keyframes: {
        ping: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
      },
      animation: {
        ping: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
