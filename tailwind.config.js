/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563EB', // Primary Brand Color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1E3A8A', // Secondary Brand Color
          950: '#172554',
        },
        primary: {
          DEFAULT: 'var(--color-primary, #2563EB)',
          hover: 'var(--color-primary-hover, #1d4ed8)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #1E3A8A)',
          hover: 'var(--color-secondary-hover, #172554)',
          foreground: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
