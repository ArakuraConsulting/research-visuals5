/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream / beige grounds
        cream: {
          50: '#FBF8F2',
          100: '#F4EEE3',
          200: '#EAE1D1',
          300: '#DCD1BC',
        },
        // Warm brown-ink text + soft taupes
        ink: {
          DEFAULT: '#3A342B',
          soft: '#726A5A',
          faint: '#A69C8A',
          line: '#E4DACA',
        },
        // Muted sage — the single accent
        accent: {
          400: '#93A17E',
          500: '#6F8161',
          600: '#55664A',
          tint: '#E7ECDE',
        },
        // A warm brown / clay used sparingly as a second tonal note
        clay: {
          400: '#B79B7C',
          500: '#96795B',
          600: '#7A5F44',
          tint: '#EEE4D5',
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
