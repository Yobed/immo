// Ce fichier est généré automatiquement par Supabase CLI.
// Commande : npx supabase gen types typescript --project-id <PROJECT_ID> > packages/shared/types/database.ts
// Régénérer après chaque migration.
//
// STATUT : Placeholder manuel — à régénérer après création du projet Supabase
// et application des 8 migrations (001 à 008).
//
// Pour régénérer :
// 1. Créer le projet Supabase sur https://app.supabase.com
// 2. Appliquer les migrations dans l'ordre (001 → 008) via SQL Editor ou Supabase CLI
// 3. Récupérer l'ID projet : Project Settings > General > Reference ID
// 4. Exécuter : npx supabase gen types typescript --project-id <REFERENCE_ID> > packages/shared/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'locataire' | 'proprietaire' | 'agence' | 'admin'
          kyc_statut: 'non_verifie' | 'en_cours' | 'verifie'
          kyc_cni_url: string | null
          kyc_selfie_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: string
          kyc_statut?: string
        }
        Update: {
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: string
          kyc_statut?: string
          kyc_cni_url?: string | null
          kyc_selfie_url?: string | null
        }
      }
      biens: {
        Row: {
          id: string
          proprietaire_id: string
          titre: string
          description: string
          type_bien: 'studio' | 'appartement' | 'villa' | 'maison' | 'bureau' | 'commerce' | 'terrain' | 'residence_meublee'
          commune: string
          quartier: string | null
          adresse_complete: string | null
          latitude: number | null
          longitude: number | null
          surface_m2: number | null
          nb_pieces: number | null
          nb_chambres: number | null
          nb_salles_bain: number | null
          etage: number | null
          nb_etages_total: number | null
          prix_mois_fcfa: number | null
          prix_nuit_fcfa: number | null
          prix_vente_fcfa: number | null
          charges_mois_fcfa: number | null
          depot_garantie_fcfa: number | null
          equipements: string[]
          statut: 'brouillon' | 'publie' | 'suspendu' | 'archive'
          vues_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          proprietaire_id: string
          titre: string
          description?: string
          type_bien: string
          commune: string
          statut?: string
        }
        Update: Partial<Database['public']['Tables']['biens']['Insert']>
      }
      biens_medias: {
        Row: {
          id: string
          bien_id: string
          type: 'photo' | 'video' | 'vue_360' | 'plan'
          url: string
          embed_url: string | null
          titre: string | null
          ordre: number
          est_couverture: boolean | null
          largeur: number | null
          hauteur: number | null
          duree_sec: number | null
          hotspots: Json
          created_at: string
        }
        Insert: {
          bien_id: string
          type: string
          url: string
          ordre?: number
          est_couverture?: boolean
        }
        Update: Partial<Database['public']['Tables']['biens_medias']['Insert']>
      }
      reservations: {
        Row: {
          id: string
          bien_id: string
          locataire_id: string
          proprietaire_id: string
          date_debut: string
          date_fin: string | null
          duree_mois: number | null
          montant_total_fcfa: number
          montant_loyer_fcfa: number
          charges_fcfa: number
          depot_garantie_fcfa: number
          commission_fcfa: number
          statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          bien_id: string
          locataire_id: string
          proprietaire_id: string
          date_debut: string
          montant_total_fcfa: number
          montant_loyer_fcfa: number
        }
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>
      }
      contrats: {
        Row: {
          id: string
          reservation_id: string
          locataire_id: string
          proprietaire_id: string
          bien_id: string
          date_debut: string
          date_fin: string | null
          duree_mois: number | null
          loyer_mois_fcfa: number
          charges_mois_fcfa: number
          depot_garantie_fcfa: number
          pdf_url: string | null
          statut: 'en_attente' | 'signe' | 'resilie' | 'expire'
          clauses_supplementaires: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          reservation_id: string
          locataire_id: string
          proprietaire_id: string
          bien_id: string
          date_debut: string
          loyer_mois_fcfa: number
        }
        Update: Partial<Database['public']['Tables']['contrats']['Insert']>
      }
      quittances: {
        Row: {
          id: string
          contrat_id: string
          locataire_id: string
          proprietaire_id: string
          mois: string
          montant_loyer_fcfa: number
          montant_charges_fcfa: number
          montant_total_fcfa: number
          date_echeance: string
          date_paiement: string | null
          statut: 'en_attente' | 'payee' | 'en_retard' | 'annulee'
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          contrat_id: string
          locataire_id: string
          proprietaire_id: string
          mois: string
          montant_loyer_fcfa: number
          montant_total_fcfa: number
          date_echeance: string
        }
        Update: Partial<Database['public']['Tables']['quittances']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          bien_id: string | null
          participant_1: string
          participant_2: string
          dernier_message: string | null
          dernier_message_at: string | null
          non_lus_p1: number
          non_lus_p2: number
          created_at: string
          updated_at: string
        }
        Insert: {
          participant_1: string
          participant_2: string
          bien_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          expediteur_id: string
          contenu: string
          lu: boolean
          created_at: string
        }
        Insert: {
          conversation_id: string
          expediteur_id: string
          contenu: string
        }
        Update: { lu?: boolean }
      }
      favoris: {
        Row: {
          id: string
          user_id: string
          bien_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          bien_id: string
        }
        Update: never
      }
      visites: {
        Row: {
          id: string
          bien_id: string
          locataire_id: string
          proprietaire_id: string
          date_souhaitee: string
          heure_debut: string | null
          heure_fin: string | null
          statut: 'en_attente' | 'confirmee' | 'annulee' | 'effectuee'
          notes: string | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          bien_id: string
          locataire_id: string
          proprietaire_id: string
          date_souhaitee: string
        }
        Update: Partial<Database['public']['Tables']['visites']['Insert']>
      }
      avis: {
        Row: {
          id: string
          auteur_id: string
          cible_id: string
          reservation_id: string | null
          note: number
          commentaire: string | null
          reponse_cible: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          auteur_id: string
          cible_id: string
          note: number
          reservation_id?: string | null
          commentaire?: string | null
        }
        Update: { reponse_cible?: string | null; commentaire?: string | null }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          titre: string
          contenu: string
          lu: boolean
          lien_type: string | null
          lien_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          titre: string
          contenu: string
          lu?: boolean
          lien_type?: string | null
          lien_id?: string | null
        }
        Update: { lu?: boolean }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          bien_id: string | null
          event_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          event_type: string
          user_id?: string | null
          bien_id?: string | null
          metadata?: Json
        }
        Update: never
      }
      paiements: {
        Row: {
          id: string
          reservation_id: string | null
          payeur_id: string
          beneficiaire_id: string | null
          montant_total_fcfa: number
          commission_fcfa: number
          montant_net_fcfa: number
          methode: 'wave' | 'orange_money' | 'mtn' | 'moov' | 'carte_bancaire' | null
          statut: 'initie' | 'en_cours' | 'succes' | 'echec' | 'annule' | 'rembourse'
          cinetpay_transaction_id: string | null
          cinetpay_payment_token: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          payeur_id: string
          montant_total_fcfa: number
          montant_net_fcfa: number
          commission_fcfa?: number
          reservation_id?: string | null
          methode?: string | null
        }
        Update: Partial<Database['public']['Tables']['paiements']['Insert']>
      }
      // Autres tables — à remplacer par la génération CLI après création du projet Supabase
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}
