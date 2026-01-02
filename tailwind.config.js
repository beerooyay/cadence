export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'var(--accent-gradient)'
      }
    }
  },
  plugins: [],
}
