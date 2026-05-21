export type AgenceKycStatut = 'en_attente' | 'verifie' | 'rejete'
export type AgenceRole = 'admin' | 'agent'

export interface Agence {
  id: string
  slug: string
  nom_commercial: string
  description: string | null
  logo_url: string | null
  telephone_public: string | null
  email_public: string | null
  rccm: string | null
  kyc_statut: AgenceKycStatut
  kyc_documents: unknown
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AgenceCreateInput {
  nom_commercial: string
  description?: string
  telephone_public?: string
  email_public?: string
  rccm?: string
}

export interface AgenceUpdateInput {
  nom_commercial?: string
  description?: string | null
  logo_url?: string | null
  telephone_public?: string | null
  email_public?: string | null
  rccm?: string | null
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}
