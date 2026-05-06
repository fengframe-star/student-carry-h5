/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2a2114",
        mist: "#fff8e6",
        campus: "#f7c948",
        honey: "#fff0b3",
        leaf: "#1f8a5b",
        coral: "#d9480f"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(116, 75, 0, 0.12)"
      }
    }
  },
  plugins: [],
};
