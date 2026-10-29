/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        erpBlue: '#0f4c81',
        erpGray: '#f4f5f7'
      }
    },
  },
  plugins: [],
}
