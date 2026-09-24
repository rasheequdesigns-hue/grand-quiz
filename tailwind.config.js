/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#064e3b', // Deep Green
        'brand-gold': '#d97706',  // Gold/Amber
        'brand-white': '#f8fafc', // Soft Off-White
      },
      fontFamily: {
        malayalam: ['Manjari', 'Meera Inimai', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
