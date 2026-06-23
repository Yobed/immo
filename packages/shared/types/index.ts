export type { CommuneAbidjan, RoleUtilisateur } from '../constants/communes'
// TypeBien vient de ../constants/biens (réexporté par l'index racine) — pas ici, sinon doublon.
export type { Database } from './database'

// Types de base plateforme (types complets dans database.ts — généré par Supabase CLI en plan 01-02)
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  message: string
  code?: string
}
