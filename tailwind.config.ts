import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#FA433F',
          dark: '#8D0300',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'red-hero': 'radial-gradient(1000px 500px at 20% 10%, rgba(250,67,63,0.25), rgba(141,3,0,0) 60%), radial-gradient(800px 400px at 80% 0%, rgba(141,3,0,0.25), rgba(141,3,0,0) 60%)',
      },
    },
  },
  plugins: [],
}

export default config


