/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          cream: "#E7DFCF"
        }
      }
    },
  },
  plugins: [],
}
