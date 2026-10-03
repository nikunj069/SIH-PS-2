/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'transparent',
        surface: 'rgba(255, 255, 255, 0.90)',
        'surface-alt': 'rgba(248, 250, 252, 0.80)',

        text: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
        },
        border: {
          DEFAULT: 'rgba(15, 23, 42, 0.09)',
          hover:   'rgba(15, 23, 42, 0.18)',
        },

        // ── PRIMARY: Amber/Orange (matches screenshot) ──────────────────
        primary: {
          DEFAULT: '#f59e0b',  // amber-500
          hover:   '#d97706',  // amber-600
          press:   '#b45309',  // amber-700
          soft:    '#fef3c7',  // amber-100
          text:    '#92400e',  // amber-900
        },

        // ── SUCCESS: Emerald ─────────────────────────────────────────────
        success: {
          DEFAULT: '#10b981',
          soft:    '#d1fae5',
          text:    '#065f46',
        },

        // ── WARNING ──────────────────────────────────────────────────────
        warning: {
          DEFAULT: '#f59e0b',
          soft:    '#fef3c7',
          text:    '#92400e',
        },

        // ── DANGER ───────────────────────────────────────────────────────
        danger: {
          DEFAULT: '#ef4444',
          soft:    '#fee2e2',
          text:    '#991b1b',
        },

        // ── INFO ─────────────────────────────────────────────────────────
        info: {
          DEFAULT: '#0ea5e9',
          soft:    '#e0f2fe',
          text:    '#0369a1',
        },

        // ── CHART palette ────────────────────────────────────────────────
        chart: {
          1: '#f59e0b', // amber  — primary
          2: '#10b981', // emerald
          3: '#0ea5e9', // sky
          4: '#8b5cf6', // violet
          5: '#ef4444', // red
          6: '#14b8a6', // teal
          7: '#64748b', // slate
          8: '#ec4899', // pink
        },

        slate: {
          900: '#0f172a',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50:  '#f8fafc',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      boxShadow: {
        card:        '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover':'0 8px 24px rgba(15,23,42,0.10)',
        drawer:      '-4px 0 24px rgba(15,23,42,0.10)',
        amber:       '0 4px 20px rgba(245,158,11,0.25)',
      },

      borderRadius: {
        control: '10px',
        card:    '16px',
        '2xl':   '16px',
        '3xl':   '24px',
      },

      backdropBlur: {
        '2xl': '32px',
      },
    },
  },
  plugins: [],
}
