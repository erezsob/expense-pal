/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#67e8f9", // Cyan 300
          DEFAULT: "#06b6d4", // Cyan 500
          dark: "#0e7490", // Cyan 700
          contrast: "#ffffff", // White for text on primary
        },
        secondary: {
          light: "#f3f4f6", // Gray 100
          DEFAULT: "#e5e7eb", // Gray 200
          dark: "#9ca3af", // Gray 400
          contrast: "#1f2937", // Gray 800 for text on secondary
        },
        accent: {
          light: "#fbbf24", // Amber 400
          DEFAULT: "#f59e0b", // Amber 500
          dark: "#b45309", // Amber 700
          contrast: "#ffffff",
        },
        background: "#ffffff", // White
        surface: "#f9fafb", // Gray 50 (for cards, modals etc.)
        "on-surface": "#111827", // Gray 900 (main text color)
        "on-surface-secondary": "#6b7280", // Gray 500 (secondary text)
        border: "#d1d5db", // Gray 300
        success: "#10b981", // Emerald 500
        error: "#ef4444", // Red 500
      },
      spacing: {
        section: "2.5rem",
      },
      borderRadius: {
        container: "0.375rem", // equivalent to md
        button: "0.375rem",
        input: "0.375rem",
        card: "0.5rem", // equivalent to lg
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
    },
  },
  plugins: [],
};
