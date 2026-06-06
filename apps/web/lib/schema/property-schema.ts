/**
 * Generate JSON-LD Property schema for Google rich snippets
 * https://schema.org/Property
 */

export interface PropertySchemaInput {
  id: string
  titre: string
  description?: string
  commune: string
  quartier?: string
  adresse?: string
  type_bien: string
  prix_vente_fcfa?: number
  prix_mois_fcfa?: number
  surface_m2?: number
  nbr_chambre?: number
  nbr_salle_bain?: number
  note_moyenne?: number
  avis_count?: number
  coverImage?: string
  allImages?: string[]
  proprietaire_nom?: string
  proprietaire_telephone?: string
}

export function generatePropertySchema(bien: PropertySchemaInput, siteUrl: string) {
  const images = [bien.coverImage, ...(bien.allImages || [])].filter(Boolean)
  
  const baseSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Property',
    name: bien.titre,
    description: bien.description?.slice(0, 500),
    image: images,
    url: `${siteUrl}/biens/${bien.id}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: bien.adresse || undefined,
      addressLocality: bien.commune,
      addressRegion: bien.quartier || undefined,
      addressCountry: 'CI',
    },
    areaServed: bien.commune,
  }

  // Add price information
  if (bien.prix_vente_fcfa) {
    baseSchema.price = bien.prix_vente_fcfa
    baseSchema.priceCurrency = 'XOF'
    baseSchema.priceType = 'PropertyPrice'
  } else if (bien.prix_mois_fcfa) {
    baseSchema.price = bien.prix_mois_fcfa
    baseSchema.priceCurrency = 'XOF'
    baseSchema.priceType = 'MonthlyPrice'
  }

  // Add property details
  if (bien.surface_m2) {
    baseSchema.floorSize = {
      '@type': 'QuantitativeValue',
      value: bien.surface_m2,
      unitCode: 'MTK', // Square meter
    }
  }

  if (bien.nbr_chambre) {
    baseSchema.numberOfRooms = bien.nbr_chambre
    baseSchema.numberOfBedrooms = bien.nbr_chambre
  }

  if (bien.nbr_salle_bain) {
    baseSchema.numberOfBathroomUnitsFull = bien.nbr_salle_bain
  }

  // Add property type mapping
  const typeMap: Record<string, string> = {
    'appartement': 'Apartment',
    'maison': 'House',
    'villa': 'House',
    'bureau': 'CommercialProperty',
    'boutique': 'CommercialProperty',
    'terrain': 'LandPlot',
    'studio': 'Apartment',
  }
  
  const mappedType = typeMap[bien.type_bien?.toLowerCase()] || 'Property'
  if (mappedType !== 'Property') {
    baseSchema['@type'] = [baseSchema['@type'], mappedType]
  }

  // Add agent/proprietaire if available
  if (bien.proprietaire_nom) {
    baseSchema.agent = {
      '@type': 'RealEstateAgent',
      name: bien.proprietaire_nom,
      telephone: bien.proprietaire_telephone,
      url: `${siteUrl}/agents/profile`,
    }
  }

  // Add aggregate rating if available
  if (bien.note_moyenne && bien.avis_count) {
    baseSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: bien.note_moyenne,
      ratingCount: bien.avis_count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Clean up undefined values
  return JSON.parse(JSON.stringify(baseSchema))
}

/**
 * Generate breadcrumb schema for navigation hierarchy
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate organization schema for site-wide SEO
 */
export function generateOrganizationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: "BOGBE'S GROUPE",
    url: siteUrl,
    logo: `${siteUrl}/bogbes-logo.png`,
    description: 'La plateforme immobilière N°1 en Côte d\'Ivoire',
    sameAs: [
      // Add social media links
      // 'https://facebook.com/bogbes-groupe',
      // 'https://instagram.com/bogbes-groupe',
    ],
  }
}
