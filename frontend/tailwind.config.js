/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens map directly to CSS variables defined in src/styles/tokens.css
        navy: {
          950: 'rgb(var(--color-navy-950) / <alpha-value>)',
          900: 'rgb(var(--color-navy-900) / <alpha-value>)',
          800: 'rgb(var(--color-navy-800) / <alpha-value>)',
          700: 'rgb(var(--color-navy-700) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        },
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          bg: 'rgb(var(--color-info-bg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        nav: 'var(--shadow-nav)',
        focus: 'var(--shadow-focus)',
      },
      borderRadius: {
        panel: 'var(--radius-panel)',
        field: 'var(--radius-field)',
        chip: 'var(--radius-chip)',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}