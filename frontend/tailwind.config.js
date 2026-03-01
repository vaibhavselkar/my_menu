/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc070',
          400: '#ff9d37',
          500: '#ff7e0f',
          600: '#f06005',
          700: '#c74706',
          800: '#9e380d',
          900: '#7f300e',
        },
        spice: {
          50: '#fdf4f3',
          100: '#fde6e3',
          200: '#fcd1cb',
          300: '#f9b0a6',
          400: '#f38272',
          500: '#e85844',
          600: '#d43e2a',
          700: '#b2311f',
          800: '#932c1e',
          900: '#7a2b1f',
        },
        leaf: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
