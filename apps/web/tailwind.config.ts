import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(25% 0.05 260)', // Deep Navy
          mid: 'oklch(40% 0.08 260)',
          light: 'oklch(95% 0.02 260)',
          glow: 'oklch(25% 0.05 260 / 10%)',
        },
        secondary: {
          DEFAULT: 'oklch(65% 0.18 45)', // Burnt Orange/Gold
          light: 'oklch(97% 0.05 45)',
          glow: 'oklch(65% 0.18 45 / 15%)',
        },
        accent: {
          DEFAULT: 'oklch(60% 0.15 150)', // Emerald/Green
          light: 'oklch(96% 0.03 150)',
        },
        danger: {
          DEFAULT: 'oklch(55% 0.18 25)', // Red
          light: 'oklch(96% 0.03 25)',
        },
        warning: {
          DEFAULT: 'oklch(75% 0.15 80)', // Gold/Yellow
          light: 'oklch(97% 0.03 80)',
        },
        surface: {
          DEFAULT: 'oklch(100% 0 0)',
          card: 'oklch(99% 0.005 260)',
          raised: 'oklch(100% 0 0)',
        },
        muted: 'oklch(45% 0.02 260)',
        subtle: 'oklch(65% 0.01 260)',
        border: {
          DEFAULT: 'oklch(92% 0.01 260)',
          hover: 'oklch(85% 0.02 260)',
        },
        midnight: {
          DEFAULT: 'var(--midnight)',
          muted: 'var(--midnight-muted)',
        },
        'off-white': {
          DEFAULT: 'var(--off-white)',
          muted: 'var(--off-white-muted)',
        },
        'accent-luxury': 'var(--accent-luxury)',
        'accent-gold':   'var(--accent-gold)',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        btn:  '12px',
        pill: '9999px',
        xl2:  '20px',
        xl3:  '24px',
      },
      boxShadow: {
        xs:          '0 1px 2px rgba(12,45,94,0.04)',
        sm:          '0 1px 4px rgba(12,45,94,0.06), 0 2px 8px rgba(12,45,94,0.04)',
        md:          '0 4px 16px rgba(12,45,94,0.08), 0 2px 6px rgba(12,45,94,0.04)',
        lg:          '0 12px 40px rgba(12,45,94,0.12), 0 4px 12px rgba(12,45,94,0.06)',
        xl:          '0 24px 60px rgba(12,45,94,0.16), 0 8px 20px rgba(12,45,94,0.08)',
        card:        '0 2px 8px rgba(12,45,94,0.06), 0 0 0 1px rgba(12,45,94,0.04)',
        'card-hover':'0 12px 40px rgba(12,45,94,0.14), 0 4px 12px rgba(12,45,94,0.06)',
        'primary-glow': '0 4px 20px rgba(12,45,94,0.20), 0 2px 8px rgba(12,45,94,0.12)',
        'secondary-glow': '0 4px 20px rgba(249, 115, 22, 0.25), 0 2px 8px rgba(249, 115, 22, 0.15)',
        'glass':     '0 8px 32px rgba(12,45,94,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0C2D5E 0%, #1A4D8F 100%)',
        'gradient-gold':    'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #F97316 100%)',
        'gradient-hero':    'linear-gradient(145deg, #0C2D5E 0%, #1A4D8F 60%, #0C3D78 100%)',
        'gradient-card':    'linear-gradient(180deg, transparent 0%, rgba(12,45,94,0.7) 100%)',
        'gradient-surface': 'linear-gradient(180deg, #F6F7FB 0%, #ECEEF6 100%)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        scaleInSpring: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        gradientPan: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '.5' },
        },
      },
      animation: {
        'fade-in-up':     'fadeInUp 0.6s cubic-bezier(0,0,0.2,1) both',
        'fade-in':        'fadeIn 0.4s cubic-bezier(0,0,0.2,1) both',
        'scale-in':       'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'scale-spring':   'scaleInSpring 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'shimmer':        'shimmer 1.8s ease-in-out infinite',
        'float':          'float 5s ease-in-out infinite',
        'gradient-pan':   'gradientPan 10s ease infinite',
        'slide-down':     'slideDown 0.3s cubic-bezier(0,0,0.2,1) both',
        'spin-slow':      'spin 3s linear infinite',
      },
      transitionTimingFunction: {
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth:  'cubic-bezier(0.4, 0, 0.2, 1)',
        gentle:  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config
