/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0a192f',
          DEFAULT: '#112240',
          light: '#1d3557'
        },
        secondary: {
          dark: '#4facfe',
          DEFAULT: '#00f2fe',
          light: '#00f2c3'
        },
        accent: {
          blue: '#4facfe',
          cyan: '#00f2fe',
          teal: '#00f2c3'
        },
        text: {
          primary: '#e6f1ff',
          secondary: '#a8b2d1',
          muted: '#8892b0'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #0a192f, #112240)',
        'gradient-accent': 'linear-gradient(to right, #4facfe, #00f2fe)',
        'gradient-text': 'linear-gradient(to right, #4facfe, #00f2fe, #00f2c3)'
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 172, 254, 0.3)',
        'glow-lg': '0 0 30px rgba(79, 172, 254, 0.4)'
      }
    },
  },
  plugins: [],
};