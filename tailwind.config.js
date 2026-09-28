/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          950: '#070C08',
          900: '#0B150E',
          850: '#0F1E14',
          800: '#14271A',
          700: '#1C3A27',
          600: '#265438',
          500: '#347D53',
          400: '#4ADE80',
          300: '#86EFAC',
          200: '#BBF7D0',
          100: '#DCFCE7',
          neon: '#C6F135',
          accent: '#A3E635',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translateY(1000%)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
