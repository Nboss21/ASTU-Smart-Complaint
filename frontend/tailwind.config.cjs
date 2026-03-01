/******** Tailwind config with a bold, academic-inspired palette ********/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#050816",
        nebula: "#4C1D95",
        aurora: "#22C55E",
        ember: "#F97316",
        slateSoft: "#1F2933",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.45)",
      },
    },
  },
  plugins: [],
};
