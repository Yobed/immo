/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refonte site vitrine (moderne épuré)
        line: '#EAE5DC',
        paper: '#FAF8F5',
        accent: '#9E7431',
        // Palette architecturale : Travertin, Albâtre, Encre Chaude, Bronze Vieilli & Vert Forêt
        canvas: '#fbfaf7',       // Fond lin / albâtre respirant
        canvasSoft: '#f5f2eb',   // Travertin doux pour zones d'accent
        surface: '#ffffff',      // Surface blanche pure pour cartes
        surfaceStone: '#f0ede6', // Dalle pierre pour contrastes doux
        
        ink: {
          DEFAULT: '#161412',    // Encre espresso / fusain profond (remplace le noir dur)
          soft: '#4a453e',       // Texte secondaire chaud
          muted: '#7a736a',      // Texte tertiaire élégant
          light: '#a39c92',      // Métadonnées discrètes
        },
        
        border: {
          subtle: '#e8e4dc',     // Ligne architecturale fine pierre
          light: '#dcd6cb',      // Séparateur visible
          hover: '#947346',      // Ligne survol bronze
        },

        bronze: {
          DEFAULT: '#947346',    // Bronze antique / laiton chaud
          dark: '#735731',       // Bronze profond pour contraste élevé
          light: '#b59363',      // Bronze clair pour survol
          surface: '#f9f6f0',    // Fond teinté bronze très doux
        },

        forest: {
          DEFAULT: '#1d382b',    // Vert forêt ivoirien profond (gage de rigueur foncière)
          light: '#2a503e',
          surface: '#f0f5f2',
        }
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -2px rgba(22, 20, 18, 0.04), 0 1px 4px -1px rgba(22, 20, 18, 0.02)',
        'warm-md': '0 12px 24px -6px rgba(22, 20, 18, 0.05), 0 4px 12px -2px rgba(22, 20, 18, 0.03)',
        'warm-lg': '0 24px 48px -12px rgba(22, 20, 18, 0.08), 0 8px 24px -4px rgba(22, 20, 18, 0.04)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out',
      },
      borderRadius: {
        'arch': '1.25rem',
        'arch-lg': '2rem',
      }
    },
  },
  plugins: [],
}
