/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./app/**/*.{js,ts,jsx,tsx}",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./context/**/*.{js,ts,jsx,tsx}",
      "./services/**/*.{js,ts,jsx,tsx}",
      "./utils/**/*.{js,ts,jsx,tsx}",
      "./*.{js,ts,jsx,tsx}" // Matches App.tsx, main.tsx etc. in root
    ],
    theme: {
      extend: {
        fontFamily: {
            sans: ["Inter", "sans-serif"],
        },
      },
    },
    plugins: [],
  }
