import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        ru: '#4ade80',
        uzb: '#fb7185',
      },
    },
  },
  plugins: [],
};

export default config;
