/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Replaced, not extended — pure #FFFFFF and #000000 are unreachable in this build.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      background: {
        DEFAULT: '#F8F6F2',
        soft: '#FAF7F3', // cards, panels, the chart surface
        warm: '#F2EDE6', // sidebar and table headers
        deep: '#EFE8DD', // insets and hover rows
        neutral: '#F5F5F5',
      },

      text: {
        primary: '#2E2E2E',
        // Darkened from the brief's #6B6B6B so it clears AA on the warm surfaces too.
        secondary: '#676767',
        muted: '#9A9A9A', // decorative only
      },

      brand: {
        DEFAULT: '#C6A96B',
        hover: '#B89658',
        bronze: '#B08D57',
        ink: '#7E5F2C', // the only gold that carries type
      },

      line: {
        DEFAULT: '#E4DCCE',
        soft: '#EDE7DC',
        strong: '#D6CBB8',
      },

      // Reserved feedback roles — never reused as a chart series colour.
      state: {
        success: '#3F6B45',
        'success-soft': '#E8EFE9',
        warning: '#8A6414',
        'warning-soft': '#F5EEDF',
        danger: '#8F3F38',
        'danger-soft': '#F6E8E6',
        info: '#2A5F8F',
        'info-soft': '#E6EDF4',
      },
    },

    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      letterSpacing: { brand: '0.16em', luxe: '0.28em' },

      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },

      opacity: { 12: '0.12', 45: '0.45', 55: '0.55', 65: '0.65', 86: '0.86', 88: '0.88', 92: '0.92' },

      // Tailwind's built-in defaults for these two are #fff and a neutral black shadow. They are
      // overridden so that even an unused default can never paint pure white or pure black.
      ringOffsetColor: { DEFAULT: '#F8F6F2' },

      boxShadow: {
        DEFAULT: '0 2px 10px -3px rgba(46,46,46,0.07), 0 1px 3px rgba(46,46,46,0.04)',
        soft: '0 2px 10px -3px rgba(46,46,46,0.07), 0 1px 3px rgba(46,46,46,0.04)',
        luxury: '0 24px 56px -20px rgba(46,46,46,0.18), 0 6px 16px -8px rgba(46,46,46,0.07)',
      },
    },
  },
  plugins: [],
}
