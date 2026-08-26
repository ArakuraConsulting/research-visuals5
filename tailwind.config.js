/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream grounds
        cream: {
          50: '#FCFAF6',
          100: '#F7F2EA',
          200: '#F0E8DB',
          300: '#E7DDCB',
        },
        // Warm near-black ink + soft greys with a faint warm bias
        ink: {
          DEFAULT: '#2B2620',
          soft: '#6E6559',
          faint: '#9E9384',
          line: '#E7DFD1',
        },
        // Arakura coral accent
        accent: {
          400: '#EC6A4B',
          500: '#E24A28',
          600: '#C63C1E',
          tint: '#FBEAE3',
        },
        // Soft, muted tones for the per-workout cards
        sage: { light: '#E6EEE6', deep: '#4E6B54' },
        blush: { light: '#F6E6E2', deep: '#A15A53' },
        lav: { light: '#EAE6F1', deep: '#615682' },
        gold: { light: '#F5EBD6', deep: '#8A6D2E' },
      },
      fontFamily: {
        display: [
          'Iowan Old Style',
          'Palatino',
          'Palatino Linotype',
          'Book Antiqua',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
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
        card: '0 10px 30px -14px rgba(43, 38, 32, 0.16)',
        soft: '0 4px 16px -8px rgba(43, 38, 32, 0.14)',
        lift: '0 18px 44px -20px rgba(43, 38, 32, 0.28)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
