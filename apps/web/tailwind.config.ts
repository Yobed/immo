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
        primary:   { DEFAULT: '#1A5276', light: '#EAF4FF' },
        secondary: { DEFAULT: '#E67E22', light: '#FEF5E7' },
        accent:    { DEFAULT: '#27AE60', light: '#E9F7EF' },
        danger:    { DEFAULT: '#E74C3C', light: '#FDEDEC' },
        warning:   { DEFAULT: '#F39C12' },
        surface:   '#F4F6F8',
        muted:     '#7F8C8D',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        btn:  '12px',
        pill: '999px',
      },
    },
  },
  plugins: [],
}
export default config
