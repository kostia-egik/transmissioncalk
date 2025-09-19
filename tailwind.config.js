/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0.8' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        'pulse-shadow': {
            '0%, 100%': { 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
            },
            '50%': { 
                boxShadow: '0 5px 9px -2px rgb(59 130 246 / 1), 0 2px 4px -3px rgb(59 130 246 / 1)'
            },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'fade-out': 'fade-out 0.5s ease-out forwards',
        'pulse-shadow': 'pulse-shadow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}