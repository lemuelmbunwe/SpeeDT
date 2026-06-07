/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './navigation/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1A2E4A',
          blue: '#2E5B9E',
          'light-blue': '#E3EDF7',
          sky: '#D6E5F5',
          card: '#DCE8F4',
          teal: '#3CB4A0',
          muted: '#64748B',
          subtle: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
};
