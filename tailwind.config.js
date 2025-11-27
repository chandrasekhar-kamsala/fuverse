/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      animation: {
        spinSlow: "spin 20s linear infinite",
        spinSlower: "spin 35s linear infinite",
        spinSlowest: "spin 50s linear infinite",
      },
    },
  },
  plugins: [],
}
