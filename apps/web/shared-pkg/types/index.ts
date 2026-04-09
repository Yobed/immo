export type { CommuneAbidjan, TypeBien, RoleUtilisateur } from '../constants/communes'

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
