/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm greige / cream grounds — quiet-luxury neutrals
        cream: {
          50: '#F7F2E8',
          100: '#EEE7D9',
          200: '#E2D8C5',
          300: '#D3C6AE',
        },
        // Warm espresso-ink text + soft taupes
        ink: {
          DEFAULT: '#37302A',
          soft: '#6C6252',
          faint: '#A0957F',
          line: '#DFD4C1',
        },
        // Muted sage — the single green accent
        accent: {
          400: '#93A07C',
          500: '#6E8060',
          600: '#54654A',
          tint: '#E5EAD9',
        },
        // Warm oak / wood — the second natural tone
        clay: {
          400: '#BB9C74',
          500: '#8C6E4A',
          600: '#6C5335',
          tint: '#EADDC7',
        },
      },
      fontFamily: {
        // Refined system sans, used for everything (display + body)
        display: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 8px 26px -16px rgba(58, 52, 43, 0.14)',
        soft: '0 3px 12px -8px rgba(58, 52, 43, 0.12)',
        lift: '0 16px 40px -22px rgba(58, 52, 43, 0.22)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
