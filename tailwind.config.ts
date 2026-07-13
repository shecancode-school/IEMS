import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        igire: {
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
