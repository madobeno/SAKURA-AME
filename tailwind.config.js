/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          900: '#4a0417',
          800: '#831843',
          700: '#be185d',
          500: '#ec4899',
          300: '#f9a8d4',
          100: '#fce7f3',
          50: '#fff1f2',
        },
        stone: {
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          500: '#78716c',
          300: '#d6d3d1',
          100: '#f5f5f4',
        }
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple-in': 'ripple-in 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'wa-float': 'wa-float 8s ease-in-out infinite',
        'bloom': 'bloom 1.5s cubic-bezier(0.1, 0.7, 0.2, 1) forwards',
        'ripple-out': 'ripple-out 4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fade-in 1.2s ease-out forwards',
      },
      keyframes: {
        'ripple-in': {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'wa-float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(0, -10px)' }
        },
        'bloom': {
          '0%': { transform: 'scale(1)', filter: 'brightness(1) blur(0px)' },
          '15%': { transform: 'scale(1.12)', filter: 'brightness(1.25) blur(1px)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1) blur(0px)' }
        },
        'ripple-out': {
          '0%': { transform: 'scale(0.5)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' }
        },
        'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '0.6' },
        },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
      }
    },
  },
  plugins: [],
}
