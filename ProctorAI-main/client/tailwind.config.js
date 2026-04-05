/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131722",
        mint: "#89e0c9",
        sand: "#f6f0e8",
        signal: "#f05e4e",
      },
      fontFamily: {
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Source Sans 3", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
