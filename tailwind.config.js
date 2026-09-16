/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/**/*.{html,js}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        almar: {
          gold: "#d4af37",
          "gold-light": "#f5e6b3",
          "gold-dark": "#aa820a",
          "gold-soft": "rgba(212, 175, 55, 0.15)",
          "gold-glow": "rgba(212, 175, 55, 0.35)",
          dark: "#0b0b0b",
          "dark-soft": "#121214",
          "dark-panel": "#18181c",
          "dark-surface": "#202026",
          "dark-card": "#16161a",
          text: "#f5f5f5",
          "text-soft": "#cfcfcf",
          "text-muted": "#a1a1aa"
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Poppins"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"]
      },
      boxShadow: {
        gold: "0 4px 20px rgba(212, 175, 55, 0.25)",
        "gold-lg": "0 10px 30px rgba(212, 175, 55, 0.35)",
        "gold-glow": "0 0 25px rgba(212, 175, 55, 0.45)",
        "dark-lg": "0 20px 50px rgba(0, 0, 0, 0.8)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem"
      }
    }
  },
  plugins: []
};
