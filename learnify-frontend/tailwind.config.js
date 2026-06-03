/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4A7FA7",
          dark: "#1A3D63",
          darker: "#0A1931",
        },
        accent: "#B3CFE5",
        background: {
          DEFAULT: "#F6FAFD",
          dark: "#0A1931",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}