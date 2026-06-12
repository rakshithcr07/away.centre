import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        away: {
          DEFAULT: '#FF5A2F',
          50: '#FFF5F0',
          100: '#FFE8DD',
          200: '#FFD4BC',
          300: '#FFBF9A',
          400: '#FFAA78',
          500: '#FF5A2F',
          600: '#E04A20',
          700: '#C03A11',
          800: '#A02A02',
          900: '#801A00',
        },
        background: {
          DEFAULT: '#F4F0ED',
          soft: '#EAE3DD',
        },
        accent: {
          brown: '#5C3A1E',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#4A4A4A',
        },
        border: {
          DEFAULT: '#D8D2CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
