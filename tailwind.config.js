/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#819A91',
        secondary: '#A7C1A8',
        accent: '#D1D8BE',
        background: '#EEEFE0',
        darkText: '#2C3E35', // Added for readable text on light backgrounds
      },
      fontFamily: {
        sans: ['"Paperlogy"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
