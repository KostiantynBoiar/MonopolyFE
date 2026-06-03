import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        navy: {
          DEFAULT: 'rgb(var(--navy) / <alpha-value>)',
          700: 'rgb(var(--navy-700) / <alpha-value>)',
        },
        blue: {
          DEFAULT: 'rgb(var(--blue) / <alpha-value>)',
          600: 'rgb(var(--blue-600) / <alpha-value>)',
          50: 'rgb(var(--blue-50) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
          50: 'rgb(var(--gold-50) / <alpha-value>)',
        },
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          2: 'rgb(var(--line-2) / <alpha-value>)',
        },
        muted: 'rgb(var(--muted) / <alpha-value>)',
        green: 'rgb(var(--green) / <alpha-value>)',
        red: 'rgb(var(--red) / <alpha-value>)',
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
        display: ['var(--font-roboto-flex)', 'sans-serif'],
        sans: ['var(--font-roboto-flex)', 'sans-serif'],
        mono: ['var(--font-roboto-flex)', 'sans-serif'],
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
        'balance-delta': {
          '0%':   { opacity: '1', transform: 'translateY(0px) scale(1)' },
          '15%':  { opacity: '1', transform: 'translateY(-3px) scale(1.07)' },
          '100%': { opacity: '0', transform: 'translateY(-18px) scale(0.92)' },
        },
      },
      animation: {
        ping: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'balance-delta': 'balance-delta 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
