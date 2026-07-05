import type { Metadata } from 'next'

/**
 * Pages SEO par commune (« location à Cocody », « maison à vendre Marcory »…).
 *
 * Chaque commune a un texte d'intro UNIQUE (2-3 phrases) — obligatoire pour
 * éviter la pénalité Google « thin/duplicate content » sur des pages générées.
 * `searchTerm` est le motif ilike envoyé à Supabase : sans accents et assez
 * distinctif pour matcher les variantes de saisie ("Port-Bouët"/"Port-Bouet").
 */

export type TypeOffre = 'location' | 'vente'

export interface SeoCommune {
  slug: string
  nom: string
  /** Affiché dans les titres quand la commune fait partie d'Abidjan */
  isAbidjan: boolean
  /** Motif de recherche ilike (sans accents, tolérant aux variantes) */
  searchTerm: string
  /** 2-3 phrases uniques sur le marché immobilier local */
  apropos: string
  /** Quartiers connus — enrichit le texte et les recherches longue traîne */
  quartiers: string[]
}

export const SEO_COMMUNES: SeoCommune[] = [
  {
    slug: 'cocody',
    nom: 'Cocody',
    isAbidjan: true,
    searchTerm: 'cocody',
    apropos:
      "Commune résidentielle de référence à Abidjan, Cocody concentre les quartiers les plus demandés : Riviera, Angré, Deux Plateaux ou encore la Palmeraie. Universités, ambassades et centres commerciaux en font un marché immobilier dynamique, du studio étudiant à la villa de standing.",
    quartiers: ['Riviera', 'Angré', 'Deux Plateaux', 'Palmeraie', 'Danga'],
  },
  {
    slug: 'plateau',
    nom: 'Plateau',
    isAbidjan: true,
    searchTerm: 'plateau',
    apropos:
      "Cœur administratif et financier de la Côte d'Ivoire, le Plateau regroupe tours de bureaux, ministères et sièges de banques. On y recherche surtout des appartements de standing et des locaux professionnels, à quelques minutes des ponts vers Marcory et Treichville.",
    quartiers: [],
  },
  {
    slug: 'marcory',
    nom: 'Marcory',
    isAbidjan: true,
    searchTerm: 'marcory',
    apropos:
      "Marcory, avec la Zone 4 et Biétry, est l'adresse préférée des expatriés et des jeunes cadres : restaurants, commerces et proximité de l'aéroport. Appartements meublés et villas y sont particulièrement recherchés.",
    quartiers: ['Zone 4', 'Biétry', 'Résidentiel'],
  },
  {
    slug: 'treichville',
    nom: 'Treichville',
    isAbidjan: true,
    searchTerm: 'treichville',
    apropos:
      "Commune historique au bord de la lagune, Treichville vit au rythme de son port, de son marché et de ses rues commerçantes. Sa position entre le Plateau et Marcory en fait un choix malin pour se loger proche du centre.",
    quartiers: [],
  },
  {
    slug: 'adjame',
    nom: 'Adjamé',
    isAbidjan: true,
    searchTerm: 'adjam',
    apropos:
      "Adjamé est le grand carrefour commercial d'Abidjan : marché, gare routière et axes vers tout le pays. Les loyers y restent accessibles pour qui veut vivre au plus près de l'activité.",
    quartiers: [],
  },
  {
    slug: 'yopougon',
    nom: 'Yopougon',
    isAbidjan: true,
    searchTerm: 'yopougon',
    apropos:
      "Commune la plus peuplée de Côte d'Ivoire, Yopougon offre des quartiers vivants et des prix parmi les plus accessibles d'Abidjan. La demande locative y est forte toute l'année.",
    quartiers: ['Niangon', 'Selmer', 'Maroc'],
  },
  {
    slug: 'abobo',
    nom: 'Abobo',
    isAbidjan: true,
    searchTerm: 'abobo',
    apropos:
      "Commune populaire du nord d'Abidjan, Abobo se transforme avec l'arrivée du métro et de nouveaux équipements. Des prix encore doux en font un terrain d'opportunités pour se loger comme pour investir.",
    quartiers: [],
  },
  {
    slug: 'koumassi',
    nom: 'Koumassi',
    isAbidjan: true,
    searchTerm: 'koumassi',
    apropos:
      "Entre zone industrielle et quartiers résidentiels comme le Remblais, Koumassi attire travailleurs et familles. Sa proximité avec Marcory et l'aéroport soutient une demande locative constante.",
    quartiers: ['Remblais'],
  },
  {
    slug: 'port-bouet',
    nom: 'Port-Bouët',
    isAbidjan: true,
    searchTerm: 'port-bou',
    apropos:
      "Port-Bouët s'étire le long du littoral, autour de l'aéroport Félix-Houphouët-Boigny et de Vridi. On y trouve aussi bien des logements abordables que des biens face à la mer.",
    quartiers: ['Vridi', 'Gonzagueville'],
  },
  {
    slug: 'attecoube',
    nom: 'Attécoubé',
    isAbidjan: true,
    searchTerm: 'coub',
    apropos:
      "Adossée à la lagune entre le Plateau et Yopougon, Attécoubé offre un accès rapide au centre-ville à des prix contenus. Une option discrète mais bien placée pour se loger à Abidjan.",
    quartiers: [],
  },
  {
    slug: 'bingerville',
    nom: 'Bingerville',
    isAbidjan: true,
    searchTerm: 'bingerville',
    apropos:
      "Ancienne capitale devenue le grand chantier résidentiel de l'Est d'Abidjan, Bingerville voit fleurir cités nouvelles et programmes immobiliers. Un marché en pleine croissance, prisé des familles et des investisseurs.",
    quartiers: ['Feh Kessé', 'Akandjé'],
  },
  {
    slug: 'songon',
    nom: 'Songon',
    isAbidjan: true,
    searchTerm: 'songon',
    apropos:
      "À l'ouest d'Abidjan, Songon est le territoire des grands terrains et des projets neufs, entre lagune et verdure. Un choix privilégié pour construire ou investir à moyen terme.",
    quartiers: [],
  },
  {
    slug: 'anyama',
    nom: 'Anyama',
    isAbidjan: true,
    searchTerm: 'anyama',
    apropos:
      "Aux portes nord d'Abidjan, Anyama combine ambiance de ville moyenne et accès direct à Abobo et au centre. Terrains et maisons y restent abordables.",
    quartiers: [],
  },
  {
    slug: 'grand-bassam',
    nom: 'Grand-Bassam',
    isAbidjan: false,
    searchTerm: 'bassam',
    apropos:
      "Première capitale de la Côte d'Ivoire et ville classée au patrimoine mondial de l'UNESCO, Grand-Bassam mêle histoire, plages et résidences de week-end. Les meublés et villas proches de la mer y rencontrent un grand succès.",
    quartiers: ['Quartier France', 'Moossou'],
  },
  {
    slug: 'assinie',
    nom: 'Assinie',
    isAbidjan: false,
    searchTerm: 'assinie',
    apropos:
      "Station balnéaire haut de gamme entre lagune et océan, Assinie est la destination des villas pieds dans l'eau et des résidences de vacances. Un marché de prestige porté par la location saisonnière.",
    quartiers: ['Assinie-Mafia', 'Assouindé'],
  },
  {
    slug: 'dabou',
    nom: 'Dabou',
    isAbidjan: false,
    searchTerm: 'dabou',
    apropos:
      "À l'ouest d'Abidjan, Dabou est un pôle agro-industriel qui se développe le long de l'axe côtier. Maisons et terrains y restent accessibles, à moins d'une heure de la capitale économique.",
    quartiers: [],
  },
  {
    slug: 'yamoussoukro',
    nom: 'Yamoussoukro',
    isAbidjan: false,
    searchTerm: 'yamoussoukro',
    apropos:
      "Capitale politique de la Côte d'Ivoire, Yamoussoukro conjugue grands boulevards, administrations et quartiers résidentiels aérés. Un marché immobilier plus calme qu'Abidjan, avec de belles opportunités à l'achat.",
    quartiers: [],
  },
]

export function getSeoCommune(slug: string): SeoCommune | undefined {
  return SEO_COMMUNES.find((c) => c.slug === slug.toLowerCase())
}

export const OFFRE_LABELS: Record<TypeOffre, { titre: string; nav: string }> = {
  location: { titre: 'Location', nav: 'À louer' },
  vente: { titre: 'Vente', nav: 'À vendre' },
}

/** Metadata Next.js d'une page commune (title/description/canonical/OG). */
export function communePageMeta(offre: TypeOffre, c: SeoCommune): Metadata {
  const lieu = c.isAbidjan ? `${c.nom} (Abidjan)` : c.nom
  const title =
    offre === 'location'
      ? `Location à ${lieu} — appartements, maisons, studios`
      : `Vente immobilière à ${lieu} — maisons, appartements, terrains`
  const description =
    offre === 'location'
      ? `Trouvez votre location à ${c.nom} : appartements, maisons, studios et résidences meublées. Annonces vérifiées BOGBE'S + offres flash en temps réel, réservation de visite en ligne.`
      : `Achetez votre bien immobilier à ${c.nom} : maisons, appartements et terrains à vendre. Annonces vérifiées, accompagnement complet jusqu'à la signature.`
  return {
    title,
    description,
    alternates: { canonical: `/${offre}/${c.slug}` },
    openGraph: { title, description, type: 'website', url: `/${offre}/${c.slug}` },
  }
}
