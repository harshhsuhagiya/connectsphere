/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--ag-primary)',
        secondary: 'var(--ag-secondary)',
        background: 'var(--ag-background)',
        surface: 'var(--ag-surface)',
        text: 'var(--ag-text)',
        textSecondary: 'var(--ag-text-secondary)',
        border: 'var(--ag-border)',
        accent: 'var(--ag-accent)',
      },
      fontFamily: {
        sans: ['var(--ag-font-family)', 'sans-serif'],
        heading: ['var(--ag-font-family-heading)', 'serif'],
      },
      borderRadius: {
        sm: 'var(--ag-radius-sm)',
        md: 'var(--ag-radius-md)',
        lg: 'var(--ag-radius-lg)',
      }
    },
  },
  plugins: [],
}
