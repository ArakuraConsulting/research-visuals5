/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy / blue palette
        navy: {
          950: '#0a1128',
          900: '#0f1b3d',
          800: '#152449',
          700: '#1c2f5c',
          600: '#243a70',
        },
        accent: {
          // lighter blue accents
          400: '#4f8ff7',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      boxShadow: {
        card: '0 8px 24px -6px rgba(10, 17, 40, 0.35)',
        soft: '0 4px 14px -4px rgba(10, 17, 40, 0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
