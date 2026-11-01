/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F4EE',
        surface: '#FFFFFF',
        'surface-2': '#EFECE3',
        ink: '#211E19',
        'ink-muted': '#6E6759',
        'ink-faint': '#9A9284',
        line: 'rgba(33,30,25,0.13)',
        accent: '#6656C4',
        'accent-ink': '#FBFAFF',
        'accent-soft': '#ECE9FA',
        good: '#3F7A5E',
        'good-soft': '#E4EFE8',
        warn: '#9C6B1F',
        'warn-soft': '#F5ECD9',
        risk: '#B3452C',
        'risk-soft': '#F7E7E2',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  darkMode: 'media',
  plugins: [],
};
