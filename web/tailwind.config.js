/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // `colors` is REPLACED, not extended, so pure #FFFFFF / #000000 and the default grey ramp
    // are unreachable. `bg-white` fails the build instead of quietly shipping.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      background: {
        DEFAULT: '#F4EFEA', // warm beige — the page base
        soft: '#F7F3EE', // soft cream — cards and raised panels
        warm: '#EAE3D9', // deeper beige — contrast sections
        mist: '#E5E5E5', // elegant soft grey — a cool break from the beige
      },

      text: {
        primary: '#2C2C2C', // 12.2:1 on the base
        secondary: '#666666', // 5.03:1 on the base
        // 2.5:1 — decorative only (placeholders, dividers, disabled glyphs). Never readable copy.
        muted: '#9A9A9A',
      },

      brand: {
        DEFAULT: '#C6A96B', // gold — fills, rules, icons
        hover: '#A8843E', // deep gold — button hover
        bronze: '#B08D57',
        // Added step. #C6A96B is 2.1:1 and #A8843E is 3.05:1 on the base — neither can carry
        // small type. This one clears AA on every light surface here (5.2:1 base, 4.6:1 warm)
        // and is the ONLY gold used for text on light backgrounds.
        ink: '#7E5F2C',
        // On a dark scrim the relationship inverts: the light golds read beautifully and the
        // ink tone disappears. Hero and image-band eyebrows use this.
        onDark: '#E0C48A',
      },

      line: {
        DEFAULT: '#E0D7CA',
        soft: '#EBE4DA',
        strong: '#D2C6B3',
      },

      state: {
        success: '#4E7A52',
        'success-soft': '#E9F0E9',
        warning: '#A97C2E',
        'warning-soft': '#F5EEDF',
        danger: '#9C4A42',
        'danger-soft': '#F5E7E5',
      },
    },

    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      letterSpacing: { luxe: '0.28em', brand: '0.16em' },

      opacity: { 12: '0.12', 15: '0.15', 45: '0.45', 55: '0.55', 65: '0.65', 86: '0.86', 88: '0.88', 92: '0.92' },

      borderRadius: { xl: '0.875rem', '2xl': '1.25rem', '3xl': '1.75rem' },

      ringOffsetColor: { DEFAULT: '#F4EFEA' },

      boxShadow: {
        // Warm-tinted and low opacity — a luxury light UI never uses neutral black shadows.
        DEFAULT: '0 2px 10px -3px rgba(44,44,44,0.08), 0 1px 3px rgba(44,44,44,0.04)',
        soft: '0 2px 10px -3px rgba(44,44,44,0.08), 0 1px 3px rgba(44,44,44,0.04)',
        luxury: '0 22px 50px -18px rgba(44,44,44,0.22), 0 6px 16px -8px rgba(44,44,44,0.08)',
        'luxury-lg': '0 40px 80px -26px rgba(44,44,44,0.30), 0 12px 26px -12px rgba(44,44,44,0.12)',
        gold: '0 16px 36px -14px rgba(168,132,62,0.55)',
      },

      backgroundImage: {
        'gold-sheen': 'linear-gradient(120deg, #A8843E 0%, #E0C48A 48%, #C6A96B 100%)',

        // ---- HERO SCRIMS -------------------------------------------------
        // The previous build washed heroes with a near-opaque CREAM gradient, which bleached the
        // photograph out. These are dark, directional and deliberately light-handed: the flat
        // layer is only 26%, so the image stays clearly visible, while the side and foot
        // gradients concentrate density exactly where type and the booking bar sit.
        'scrim-flat': 'linear-gradient(rgba(28,24,20,0.26), rgba(28,24,20,0.26))',
        'scrim-side':
          'linear-gradient(to right, rgba(24,20,16,0.62) 0%, rgba(24,20,16,0.34) 38%, rgba(24,20,16,0) 72%)',
        'scrim-foot':
          'linear-gradient(to top, rgba(24,20,16,0.72) 0%, rgba(24,20,16,0.30) 24%, rgba(24,20,16,0) 55%)',
        // Softer pairing for interior page headers, which carry less type.
        'scrim-header':
          'linear-gradient(to top, rgba(24,20,16,0.66) 0%, rgba(24,20,16,0.32) 40%, rgba(24,20,16,0.12) 100%)',
      },

      keyframes: {
        'ken-burns': {
          '0%': { transform: 'scale(1.02) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.14) translate3d(0,-1.5%,0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        // Tied to the hero cadence: a slide is only up for ~3s, so an 18s zoom moved the frame
        // by barely 2% and read as static. At 8s the drift is visible within a single turn while
        // staying slow enough to feel like a camera move rather than a scale transition.
        'ken-burns': 'ken-burns 8s ease-out forwards',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
}
