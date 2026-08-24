/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        xl2: '18px',
      },
    },
  },
  plugins: [],
};
