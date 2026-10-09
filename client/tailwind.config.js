/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        brand: {
          50: '#FFF3EE', 100: '#FFE3D6', 200: '#FFC3A8', 300: '#FF9C73', 400: '#FF7A47',
          500: '#FF5A1F', 600: '#EB4710', 700: '#C2370C', 800: '#9A2E10', 900: '#7C2911',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(17 19 24 / .04), 0 8px 24px -12px rgb(17 19 24 / .12)',
        lift: '0 2px 4px rgb(17 19 24 / .04), 0 24px 48px -20px rgb(17 19 24 / .25)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        marquee: { to: { transform: 'translateX(-50%)' } },
      },
      animation: { 'fade-up': 'fade-up .5s cubic-bezier(.2,.8,.2,1) both', marquee: 'marquee 30s linear infinite' },
    },
  },
  plugins: [],
};
