/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'brand': "url('/img/bg.png')",
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      rvl: {
        "primary": "#32D0AA",
        "secondary": "#0D0C2B",
        "accent": "#37CDBE",
        "neutral": "#262641",
        "base-100": "#FFFFFF",
        "info": "#3ABFF8",
        "success": "#36D399",
        "warning": "#FBBD23",
        "error": "#F87272",
      }
    },],// "light", "dark"],
  },
}
