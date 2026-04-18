/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        marlaa: '#d97757',
        tsogoo: '#5b8c9f',
        shared: '#8b6f47',
        warm: {
          50:  '#fdfcfa',
          100: '#f7f5f2',
          200: '#e8e4dd',
          300: '#d0c8bd',
          600: '#6b6356',
          800: '#2d2820',
        },
      },
    },
  },
  plugins: [],
}
