/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      fontWeight: {
        400: '400',
        500: '500',
        600: '600',
        700: '700',
      },
      colors: {
        // Warm, editorial real-estate palette: bone paper, ink, terracotta accent, sage support.
        canvas: '#f6f1ea',
        paper: '#fbf8f3',
        ink: {
          DEFAULT: '#211d18',
          soft: '#4b443b',
          muted: '#8a8177',
        },
        terracotta: {
          50: '#fbf1ec',
          100: '#f4ddd2',
          200: '#e9bba7',
          300: '#dd9578',
          400: '#d1734f',
          500: '#c05a35',
          600: '#a5472a',
          700: '#843823',
          800: '#652c1e',
          900: '#4c231a',
        },
        sage: {
          100: '#e6ebe3',
          200: '#cad4c3',
          300: '#a9b89f',
          400: '#889a7c',
          500: '#6d7f61',
          600: '#55654c',
        },
        line: '#e4ddcd',
      },
      boxShadow: {
        card: '0 1px 2px rgba(33, 29, 24, 0.04), 0 12px 30px -12px rgba(33, 29, 24, 0.18)',
        lift: '0 2px 6px rgba(33, 29, 24, 0.06), 0 24px 48px -20px rgba(33, 29, 24, 0.28)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
