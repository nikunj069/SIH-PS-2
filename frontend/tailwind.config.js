/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F8FB',
        surface: '#FFFFFF',
        'surface-alt': '#F1F5F9',
        text: {
          DEFAULT: '#0F172A',
          muted: '#475569',
        },
        border: {
          DEFAULT: '#D9E0EA',
          hover: '#B9C5D5',
        },
        chart: {
          1: '#0B63CE', // blue
          2: '#0F7B5F', // teal
          3: '#D97706', // amber
          4: '#6D28D9', // violet
          5: '#B42318', // red
          6: '#0284C7', // sky
          7: '#64748B', // slate
          8: '#BE185D', // rose
        },
        slate: {
          900: '#0F172A',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#0B63CE',
          hover: '#0A55B0',
          press: '#084792',
          soft: '#E8F1FD',
          text: '#0A4FA3',
        },
        success: {
          DEFAULT: '#0F7B5F',
          soft: '#E3F5EE',
          text: '#065F46',
        },
        warning: {
          DEFAULT: '#B45309',
          soft: '#FEF3C7',
          text: '#92400E',
        },
        danger: {
          DEFAULT: '#B42318',
          soft: '#FDECEA',
          text: '#991B1B',
        },
        info: {
          DEFAULT: '#0B4FA3',
          soft: '#E8F1FD',
          text: '#0A3B7B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
        drawer: '-4px 0 24px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        control: '8px',
        card: '12px',
      }
    },
  },
  plugins: [],
}
