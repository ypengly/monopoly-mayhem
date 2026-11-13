/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', '"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#2b1b5a',
        candy: {
          pink: '#ff5fa2',
          orange: '#ff9f43',
          yellow: '#ffd93d',
          green: '#2ed573',
          blue: '#3ea8ff',
          purple: '#8a5cff',
        },
      },
      boxShadow: {
        pop: '0 6px 0 rgba(43,27,90,0.35)',
        soft: '0 10px 30px rgba(43,27,90,0.25)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        floaty: 'floaty 3s ease-in-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
      },
    },
  },
  plugins: [],
};
