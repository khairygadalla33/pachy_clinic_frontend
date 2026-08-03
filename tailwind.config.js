/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f9', 100: '#fae3f1', 200: '#f5c6e5', 300: '#f09ad1',
          400: '#e662b6', 500: '#d53a9d', 600: '#C0389F', 700: '#a42381',
          800: '#871f6a', 900: '#701d59', 950: '#450a35',
        },
        secondary: {
          50: '#f5f3f9', 100: '#ebe6f2', 200: '#d5cbe4', 300: '#b5a5d1',
          400: '#937db9', 500: '#795ea3', 600: '#6B4C9A', 700: '#5a3e83',
          800: '#4c356e', 900: '#402d59', 950: '#291b3e',
        },
        surface: {
          50: '#F3F0F7', 100: '#ede8f2', 200: '#e2d8ed', 300: '#d1c2df',
          400: '#bda6cc', 500: '#a487b5', 600: '#8b6b9c', 700: '#7A6B8A',
          800: '#5c4d69', 900: '#2D2040', 950: '#1b1227',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        sidebar: '4px 0 6px -1px rgb(0 0 0 / 0.05)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
