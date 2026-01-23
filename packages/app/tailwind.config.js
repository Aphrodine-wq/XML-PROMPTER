/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Brutalist color palette - stark contrasts, no gradients
        primary: '#FF6B00',    // Bold orange
        secondary: '#000000',  // Pure black
        accent: '#FFFF00',     // Yellow for highlights
        surface: '#FFFFFF',    // Pure white
        border: '#000000',     // Black borders
        text: {
          primary: '#000000',
          secondary: '#666666',
          inverse: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif']
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', fontWeight: '900' }],
        'hero': ['3rem', { lineHeight: '1.2', fontWeight: '800' }],
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '6': '6px',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}
