/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        fontFamily: {
          display: ['CormorantGaramond_600SemiBold'],
          'display-bold': ['CormorantGaramond_700Bold'],
          'display-italic': ['CormorantGaramond_600SemiBold_Italic'],
          serif: ['CormorantGaramond_500Medium'],
          sans: ['Manrope_400Regular'],
          'sans-medium': ['Manrope_500Medium'],
          'sans-semibold': ['Manrope_600SemiBold'],
          'sans-bold': ['Manrope_700Bold'],
        },
      },
    },
    plugins: [],
  }
