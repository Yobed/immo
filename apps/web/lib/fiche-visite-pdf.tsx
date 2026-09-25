// lib/fiche-visite-pdf.tsx
// Fiche de visite prospect (Bon de visite immobilier) — @react-pdf/renderer
// IMPORTANT: Ce fichier est importé uniquement depuis des routes serveur
// (serverExternalPackages garantit le bon module resolution)

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface BienVisiteItem {
  ref: string
  titre: string
  typeBien: string
  localisation: string
  prixLabel: string
  observations?: string
}

export interface FicheVisiteProps {
  ficheNum: string
  dateEdition: string
  // Prospect / Visiteur
  prospectNom: string
  prospectTel: string
  prospectEmail?: string
  prospectCni?: string
  prospectCritere?: string
  prospectBudget?: string
  // Visite & Agent
  dateVisite: string
  creneauHoraire: string
  commercialNom: string
  commercialTel?: string
  // Biens visités
  biens: BienVisiteItem[]
  notesVisite?: string
}

const S = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  // Header
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    paddingBottom: 10,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 8.5,
    color: '#475569',
    marginTop: 2,
  },
  docBadge: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    textAlign: 'right',
  },
  docBadgeTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  docBadgeRef: {
    fontSize: 8,
    color: '#CBD5E1',
    marginTop: 2,
  },
  // Grid 2 colonnes (Prospect + Visite)
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  card: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    padding: 9,
    backgroundColor: '#F8FAFC',
  },
  cardTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldLabel: {
    width: '38%',
    fontSize: 8.5,
    color: '#64748B',
  },
  fieldValue: {
    width: '62%',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderBottomStyle: 'dashed',
    height: 11,
    width: '62%',
  },
  // Section générique
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 0,
  },
  // Tableau des biens
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopWidth: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 26,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colNum: { width: '5%', fontSize: 8, textAlign: 'center' },
  colRef: { width: '13%', fontSize: 8, paddingRight: 4 },
  colType: { width: '22%', fontSize: 8.5, paddingRight: 4 },
  colLoc: { width: '24%', fontSize: 8.5, paddingRight: 4 },
  colPrix: { width: '16%', fontSize: 8.5, fontFamily: 'Helvetica-Bold', paddingRight: 4 },
  colObs: { width: '20%', fontSize: 8 },
  thText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  // Feedback / Appréciation rapide
  feedbackBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 6,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxSquare: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 4,
  },
  notesLines: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'dashed',
    height: 14,
    marginBottom: 3,
  },
  // Clauses juridiques
  legalBox: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  legalTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  legalText: {
    fontSize: 7.8,
    lineHeight: 1.38,
    color: '#334155',
    textAlign: 'justify',
    marginBottom: 3,
  },
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sigBox: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 4,
    padding: 8,
    minHeight: 82,
  },
  sigTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 3,
  },
  sigSub: {
    fontSize: 7.5,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 36,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#64748B',
  },
})

export function FicheVisiteDocument(props: FicheVisiteProps) {
  const {
    ficheNum,
    dateEdition,
    prospectNom,
    prospectTel,
    prospectEmail,
    prospectCni,
    prospectCritere,
    prospectBudget,
    dateVisite,
    creneauHoraire,
    commercialNom,
    commercialTel,
    biens,
    notesVisite,
  } = props

  // Toujours afficher au moins 3 lignes dans le tableau des biens pour permettre d'ajouter des biens visités sur le terrain
  const rows: (BienVisiteItem | null)[] = [...biens]
  while (rows.length < 3) {
    rows.push(null)
  }

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête Agence */}
        <View style={S.headerBox}>
          <View>
            <Text style={S.brandTitle}>BOGBE&apos;S GROUPE IMMOBILIER</Text>
            <Text style={S.brandSub}>Agence Immobilière — Gestion, Location, Vente &amp; Conseil</Text>
            <Text style={S.brandSub}>Abidjan, Côte d&apos;Ivoire — Web : www.bogbesgroup.com</Text>
          </View>
          <View style={S.docBadge}>
            <Text style={S.docBadgeTitle}>FICHE DE VISITE PROSPECT</Text>
            <Text style={S.docBadgeRef}>Réf : {ficheNum} | Éditée le {dateEdition}</Text>
          </View>
        </View>

        {/* Informations Prospect & Détails RDV */}
        <View style={S.twoCol}>
          {/* Prospect */}
          <View style={S.card}>
            <Text style={S.cardTitle}>1. Identité du Prospect (Visiteur)</Text>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Nom &amp; Prénoms :</Text>
              <Text style={S.fieldValue}>{prospectNom || '____________________________'}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Téléphone :</Text>
              <Text style={S.fieldValue}>{prospectTel || '____________________________'}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>N° CNI / Pièce :</Text>
              {prospectCni ? (
                <Text style={S.fieldValue}>{prospectCni}</Text>
              ) : (
                <View style={S.dottedLine} />
              )}
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Email / Adresse :</Text>
              {prospectEmail ? (
                <Text style={S.fieldValue}>{prospectEmail}</Text>
              ) : (
                <View style={S.dottedLine} />
              )}
            </View>
            {(prospectCritere || prospectBudget) && (
              <View style={S.fieldRow}>
                <Text style={S.fieldLabel}>Recherche :</Text>
                <Text style={S.fieldValue}>
                  {[prospectCritere, prospectBudget ? `Budget: ${prospectBudget}` : ''].filter(Boolean).join(' — ')}
                </Text>
              </View>
            )}
          </View>

          {/* Organisation de la visite */}
          <View style={S.card}>
            <Text style={S.cardTitle}>2. Organisation de la Visite</Text>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Date de visite :</Text>
              <Text style={S.fieldValue}>{dateVisite}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Créneau horaire :</Text>
              <Text style={S.fieldValue}>{creneauHoraire}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Commercial(e) :</Text>
              <Text style={S.fieldValue}>{commercialNom || 'Conseiller BOGBE\'S'}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Tél. Commercial :</Text>
              <Text style={S.fieldValue}>{commercialTel || '____________________________'}</Text>
            </View>
            <View style={S.fieldRow}>
              <Text style={S.fieldLabel}>Accompagnant :</Text>
              <View style={S.dottedLine} />
            </View>
          </View>
        </View>

        {/* Tableau des biens présentés et visités */}
        <View style={S.section}>
          <Text style={S.sectionHeader}>3. DÉSIGNATION DU OU DES BIENS VISITÉS</Text>
          <View style={S.table}>
            <View style={S.tableHeader}>
              <Text style={[S.colNum, S.thText]}>N°</Text>
              <Text style={[S.colRef, S.thText]}>Réf. Bien</Text>
              <Text style={[S.colType, S.thText]}>Désignation / Type</Text>
              <Text style={[S.colLoc, S.thText]}>Commune / Quartier</Text>
              <Text style={[S.colPrix, S.thText]}>Loyer / Prix</Text>
              <Text style={[S.colObs, S.thText]}>Appréciation client</Text>
            </View>
            {rows.map((item, idx) => (
              <View
                key={idx}
                style={[
                  S.tableRow,
                  !item ? { minHeight: 28, backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF' } : {},
                ]}
              >
                <Text style={S.colNum}>{idx + 1}</Text>
                <Text style={S.colRef}>{item?.ref ?? ''}</Text>
                <Text style={S.colType}>
                  {item
                    ? item.titre.toLowerCase().startsWith(item.typeBien.toLowerCase())
                      ? item.titre
                      : `${item.typeBien ? item.typeBien.toUpperCase() + ' — ' : ''}${item.titre}`
                    : ''}
                </Text>
                <Text style={S.colLoc}>{item?.localisation ?? ''}</Text>
                <Text style={S.colPrix}>{item?.prixLabel ?? ''}</Text>
                <Text style={S.colObs}>{item?.observations ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Compte rendu & Appréciation */}
        <View style={S.feedbackBox}>
          <Text style={S.cardTitle}>4. Appréciation Générale &amp; Suite à Donner</Text>
          <View style={S.checkboxRow}>
            <View style={S.checkboxItem}>
              <View style={S.checkboxSquare} />
              <Text style={{ fontSize: 8.5 }}>Coup de cœur / Réservation immédiate</Text>
            </View>
            <View style={S.checkboxItem}>
              <View style={S.checkboxSquare} />
              <Text style={{ fontSize: 8.5 }}>Intéressé (en réflexion)</Text>
            </View>
            <View style={S.checkboxItem}>
              <View style={S.checkboxSquare} />
              <Text style={{ fontSize: 8.5 }}>Contre-visite souhaitée</Text>
            </View>
            <View style={S.checkboxItem}>
              <View style={S.checkboxSquare} />
              <Text style={{ fontSize: 8.5 }}>Ne correspond pas</Text>
            </View>
          </View>
          <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 3 }}>
            Observations / Points relevés lors de la visite :
          </Text>
          {notesVisite ? (
            <Text style={{ fontSize: 8.5, marginBottom: 4 }}>{notesVisite}</Text>
          ) : null}
          <View style={S.notesLines} />
          <View style={S.notesLines} />
        </View>

        {/* Clauses Juridiques et Engagement */}
        <View style={S.legalBox}>
          <Text style={S.legalTitle}>5. Reconnaissance de Visite &amp; Engagement de Non-Contournement</Text>
          <Text style={S.legalText}>
            1. Le(s) visiteur(s) soussigné(s) reconnaît(reconnaissent) expressément avoir pris connaissance et visité ce jour le(s) bien(s) immobilier(s) désigné(s) ci-dessus grâce aux soins et par l&apos;entremise exclusive de BOGBE&apos;S GROUPE IMMOBILIER.
          </Text>
          <Text style={S.legalText}>
            2. CLAUSE DE NON-CONTOURNEMENT : Le visiteur s&apos;interdit formellement de traiter directement ou indirectement (par conjoint, parent, société, prête-nom ou tout autre intermédiaire) la location ou l&apos;achat d&apos;un ou plusieurs des biens présentés avec le propriétaire/bailleur sans le concours de BOGBE&apos;S GROUPE IMMOBILIER, et ce pendant une durée de DOUZE (12) MOIS à compter de la date de signature du présent bon de visite.
          </Text>
          <Text style={S.legalText}>
            3. À défaut de respect de cette clause, le visiteur s&apos;engage à verser immédiatement à BOGBE&apos;S GROUPE IMMOBILIER, à titre de clause pénale irréductible, une indemnité compensatrice égale au montant intégral des honoraires d&apos;agence prévus, sans préjudice de tous dommages et intérêts et frais de recouvrement judiciaire.
          </Text>
        </View>

        {/* Signatures */}
        <View style={S.signaturesRow}>
          <View style={S.sigBox}>
            <Text style={S.sigTitle}>LE VISITEUR / PROSPECT</Text>
            <Text style={S.sigSub}>
              Mention manuscrite « Lu et approuvé, bon pour reconnaissance de visite » + Signature :
            </Text>
            <Text style={{ fontSize: 8, color: '#475569' }}>Nom : {prospectNom || '_________________________'}</Text>
          </View>

          <View style={S.sigBox}>
            <Text style={S.sigTitle}>POUR BOGBE&apos;S GROUPE IMMOBILIER</Text>
            <Text style={S.sigSub}>Le Commercial / Négociateur accompagnateur (Signature &amp; Cachet) :</Text>
            <Text style={{ fontSize: 8, color: '#475569' }}>Agent : {commercialNom || '_________________________'}</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={S.footer}>
          <Text>BOGBE&apos;S GROUPE IMMOBILIER — Document officiel de suivi de visite</Text>
          <Text>Fiche N° {ficheNum} — Page 1/1</Text>
        </View>
      </Page>
    </Document>
  )
}
