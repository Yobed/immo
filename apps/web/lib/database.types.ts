export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          bien_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          bien_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          bien_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avis: {
        Row: {
          auteur_id: string
          cible_id: string
          commentaire: string | null
          created_at: string
          id: string
          note: number
          reponse_cible: string | null
          reservation_id: string | null
          updated_at: string
        }
        Insert: {
          auteur_id: string
          cible_id: string
          commentaire?: string | null
          created_at?: string
          id?: string
          note: number
          reponse_cible?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Update: {
          auteur_id?: string
          cible_id?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          note?: number
          reponse_cible?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avis_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_cible_id_fkey"
            columns: ["cible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      biens: {
        Row: {
          adresse_complete: string | null
          charges_mois_fcfa: number | null
          commune: string
          created_at: string
          depot_garantie_fcfa: number | null
          description: string
          equipements: string[] | null
          etage: number | null
          fts: unknown
          id: string
          latitude: number | null
          longitude: number | null
          nb_chambres: number | null
          nb_etages_total: number | null
          nb_pieces: number | null
          nb_salles_bain: number | null
          prix_mois_fcfa: number | null
          prix_nuit_fcfa: number | null
          prix_vente_fcfa: number | null
          proprietaire_id: string
          quartier: string | null
          statut: string
          surface_m2: number | null
          titre: string
          type_bien: string
          updated_at: string
          vues_count: number
        }
        Insert: {
          adresse_complete?: string | null
          charges_mois_fcfa?: number | null
          commune: string
          created_at?: string
          depot_garantie_fcfa?: number | null
          description?: string
          equipements?: string[] | null
          etage?: number | null
          fts?: unknown
          id?: string
          latitude?: number | null
          longitude?: number | null
          nb_chambres?: number | null
          nb_etages_total?: number | null
          nb_pieces?: number | null
          nb_salles_bain?: number | null
          prix_mois_fcfa?: number | null
          prix_nuit_fcfa?: number | null
          prix_vente_fcfa?: number | null
          proprietaire_id: string
          quartier?: string | null
          statut?: string
          surface_m2?: number | null
          titre: string
          type_bien: string
          updated_at?: string
          vues_count?: number
        }
        Update: {
          adresse_complete?: string | null
          charges_mois_fcfa?: number | null
          commune?: string
          created_at?: string
          depot_garantie_fcfa?: number | null
          description?: string
          equipements?: string[] | null
          etage?: number | null
          fts?: unknown
          id?: string
          latitude?: number | null
          longitude?: number | null
          nb_chambres?: number | null
          nb_etages_total?: number | null
          nb_pieces?: number | null
          nb_salles_bain?: number | null
          prix_mois_fcfa?: number | null
          prix_nuit_fcfa?: number | null
          prix_vente_fcfa?: number | null
          proprietaire_id?: string
          quartier?: string | null
          statut?: string
          surface_m2?: number | null
          titre?: string
          type_bien?: string
          updated_at?: string
          vues_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "biens_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      biens_medias: {
        Row: {
          bien_id: string
          created_at: string | null
          duree_sec: number | null
          embed_url: string | null
          est_couverture: boolean | null
          hauteur: number | null
          hotspots: Json | null
          id: string
          largeur: number | null
          ordre: number
          titre: string | null
          type: string
          url: string
        }
        Insert: {
          bien_id: string
          created_at?: string | null
          duree_sec?: number | null
          embed_url?: string | null
          est_couverture?: boolean | null
          hauteur?: number | null
          hotspots?: Json | null
          id?: string
          largeur?: number | null
          ordre?: number
          titre?: string | null
          type: string
          url: string
        }
        Update: {
          bien_id?: string
          created_at?: string | null
          duree_sec?: number | null
          embed_url?: string | null
          est_couverture?: boolean | null
          hauteur?: number | null
          hotspots?: Json | null
          id?: string
          largeur?: number | null
          ordre?: number
          titre?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "biens_medias_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
        ]
      }
      contrats: {
        Row: {
          bien_id: string
          charges_mois_fcfa: number
          clauses_supplementaires: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          depot_garantie_fcfa: number
          duree_mois: number | null
          id: string
          locataire_id: string
          loyer_mois_fcfa: number
          pdf_url: string | null
          proprietaire_id: string
          reservation_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          bien_id: string
          charges_mois_fcfa?: number
          clauses_supplementaires?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          depot_garantie_fcfa?: number
          duree_mois?: number | null
          id?: string
          locataire_id: string
          loyer_mois_fcfa: number
          pdf_url?: string | null
          proprietaire_id: string
          reservation_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          bien_id?: string
          charges_mois_fcfa?: number
          clauses_supplementaires?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          depot_garantie_fcfa?: number
          duree_mois?: number | null
          id?: string
          locataire_id?: string
          loyer_mois_fcfa?: number
          pdf_url?: string | null
          proprietaire_id?: string
          reservation_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrats_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          bien_id: string | null
          created_at: string
          dernier_message: string | null
          dernier_message_at: string | null
          id: string
          non_lus_p1: number
          non_lus_p2: number
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          bien_id?: string | null
          created_at?: string
          dernier_message?: string | null
          dernier_message_at?: string | null
          id?: string
          non_lus_p1?: number
          non_lus_p2?: number
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          bien_id?: string | null
          created_at?: string
          dernier_message?: string | null
          dernier_message_at?: string | null
          id?: string
          non_lus_p1?: number
          non_lus_p2?: number
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favoris: {
        Row: {
          bien_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bien_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bien_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoris_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoris_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contenu: string
          conversation_id: string
          created_at: string
          expediteur_id: string
          id: string
          lu: boolean
        }
        Insert: {
          contenu: string
          conversation_id: string
          created_at?: string
          expediteur_id: string
          id?: string
          lu?: boolean
        }
        Update: {
          contenu?: string
          conversation_id?: string
          created_at?: string
          expediteur_id?: string
          id?: string
          lu?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contenu: string
          created_at: string
          id: string
          lien_id: string | null
          lien_type: string | null
          lu: boolean
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          lien_id?: string | null
          lien_type?: string | null
          lu?: boolean
          titre: string
          type: string
          user_id: string
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          lien_id?: string | null
          lien_type?: string | null
          lu?: boolean
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          beneficiaire_id: string | null
          cinetpay_payment_token: string | null
          cinetpay_transaction_id: string | null
          commission_fcfa: number
          created_at: string
          id: string
          metadata: Json | null
          methode: string | null
          montant_net_fcfa: number
          montant_total_fcfa: number
          payeur_id: string
          reservation_id: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          beneficiaire_id?: string | null
          cinetpay_payment_token?: string | null
          cinetpay_transaction_id?: string | null
          commission_fcfa?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          methode?: string | null
          montant_net_fcfa: number
          montant_total_fcfa: number
          payeur_id: string
          reservation_id?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          beneficiaire_id?: string | null
          cinetpay_payment_token?: string | null
          cinetpay_transaction_id?: string | null
          commission_fcfa?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          methode?: string | null
          montant_net_fcfa?: number
          montant_total_fcfa?: number
          payeur_id?: string
          reservation_id?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_beneficiaire_id_fkey"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_payeur_id_fkey"
            columns: ["payeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          kyc_cni_url: string | null
          kyc_selfie_url: string | null
          kyc_statut: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          kyc_cni_url?: string | null
          kyc_selfie_url?: string | null
          kyc_statut?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          kyc_cni_url?: string | null
          kyc_selfie_url?: string | null
          kyc_statut?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quittances: {
        Row: {
          contrat_id: string
          created_at: string
          date_echeance: string
          date_paiement: string | null
          id: string
          locataire_id: string
          mois: string
          montant_charges_fcfa: number
          montant_loyer_fcfa: number
          montant_total_fcfa: number
          pdf_url: string | null
          proprietaire_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          contrat_id: string
          created_at?: string
          date_echeance: string
          date_paiement?: string | null
          id?: string
          locataire_id: string
          mois: string
          montant_charges_fcfa?: number
          montant_loyer_fcfa: number
          montant_total_fcfa: number
          pdf_url?: string | null
          proprietaire_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          contrat_id?: string
          created_at?: string
          date_echeance?: string
          date_paiement?: string | null
          id?: string
          locataire_id?: string
          mois?: string
          montant_charges_fcfa?: number
          montant_loyer_fcfa?: number
          montant_total_fcfa?: number
          pdf_url?: string | null
          proprietaire_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quittances_contrat_id_fkey"
            columns: ["contrat_id"]
            isOneToOne: false
            referencedRelation: "contrats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quittances_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quittances_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          bien_id: string
          charges_fcfa: number
          commission_fcfa: number
          created_at: string
          date_debut: string
          date_fin: string | null
          depot_garantie_fcfa: number
          duree_mois: number | null
          id: string
          locataire_id: string
          montant_loyer_fcfa: number
          montant_total_fcfa: number
          notes: string | null
          proprietaire_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          bien_id: string
          charges_fcfa?: number
          commission_fcfa?: number
          created_at?: string
          date_debut: string
          date_fin?: string | null
          depot_garantie_fcfa?: number
          duree_mois?: number | null
          id?: string
          locataire_id: string
          montant_loyer_fcfa: number
          montant_total_fcfa: number
          notes?: string | null
          proprietaire_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          bien_id?: string
          charges_fcfa?: number
          commission_fcfa?: number
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          depot_garantie_fcfa?: number
          duree_mois?: number | null
          id?: string
          locataire_id?: string
          montant_loyer_fcfa?: number
          montant_total_fcfa?: number
          notes?: string | null
          proprietaire_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visites: {
        Row: {
          bien_id: string
          created_at: string
          date_souhaitee: string
          feedback: string | null
          heure_debut: string | null
          heure_fin: string | null
          id: string
          locataire_id: string
          notes: string | null
          proprietaire_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          bien_id: string
          created_at?: string
          date_souhaitee: string
          feedback?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          locataire_id: string
          notes?: string | null
          proprietaire_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          bien_id?: string
          created_at?: string
          date_souhaitee?: string
          feedback?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          locataire_id?: string
          notes?: string | null
          proprietaire_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visites_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visites_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
