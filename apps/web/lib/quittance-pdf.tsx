// lib/quittance-pdf.tsx
// Quittance de loyer mensuelle — @react-pdf/renderer
// IMPORTANT: Ce fichier est importe uniquement depuis des routes serveur
// (serverExternalPackages garantit le bon module resolution)

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ToWords } from 'to-words'

// CRITIQUE: currency:false OBLIGATOIRE — currency:true genere "euros"
const toWords = new ToWords({
  localeCode:       'fr-FR',
  converterOptions: { currency: false },
})

/** Convertit un montant entier FCFA en lettres francaises */
export function montantEnLettres(montant: number): string {
  return `${toWords.convert(Math.round(montant))} francs CFA`
  // Ex: 150000 -> "cent cinquante mille francs CFA"
}

export interface QuittanceProps {
  quittanceId:     string
  contratId:       string
  mois:            string  // format: "2026-02-01" — afficher "fevrier 2026"
  // Bailleur
  bailleurNom:     string
  bailleurTel:     string
  // Preneur
  preneurNom:      string
  preneurTel:      string
  // Bien
  bienAdresse:     string
  bienCommune:     string
  // Financier
  loyerMoisFcfa:   number
  chargesMoisFcfa: number
  totalFcfa:       number
  dateEcheance:    string  // format: "01/02/2026"
  datePaiement?:   string  // nullable — vide si non paye
  statut:          'en_attente' | 'payee' | 'en_retard' | 'annulee'
}

const S = StyleSheet.create({
  page:       { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#1C2833' },
  titre:      { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  sousTitre:  { fontSize: 10, textAlign: 'center', marginBottom: 20, color: '#7F8C8D' },
  ref:        { fontSize: 9, textAlign: 'right', marginBottom: 16, color: '#7F8C8D' },
  section:    { marginBottom: 14 },
  sectionH:   { fontSize: 11, fontWeight: 'bold', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E5E8EC', paddingBottom: 3 },
  row:        { flexDirection: 'row', marginBottom: 4 },
  label:      { width: '45%', color: '#7F8C8D' },
  value:      { width: '55%', fontFamily: 'Helvetica-Bold' },
  montant:    { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1A5276', marginBottom: 4 },
  montantLet: { fontStyle: 'italic', color: '#1A5276', marginBottom: 12 },
  statutBox:  { padding: 8, backgroundColor: '#EBF5FB', marginBottom: 16, borderRadius: 4 },
  footer:     { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#7F8C8D' },
  signatures: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  sigBox:     { width: '45%', borderTopWidth: 1, borderTopColor: '#1C2833', paddingTop: 8 },
})

function formatMois(moisIso: string): string {
  const date = new Date(moisIso)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function statutLabel(statut: string): string {
  const map: Record<string, string> = {
    en_attente: 'En attente de paiement',
    payee:      'PAYEE',
    en_retard:  'EN RETARD',
    annulee:    'Annulee',
  }
  return map[statut] ?? statut
}

export function QuittanceDocument(props: QuittanceProps) {
  const {
    quittanceId, contratId, mois,
    bailleurNom, bailleurTel,
    preneurNom, preneurTel,
    bienAdresse, bienCommune,
    loyerMoisFcfa, chargesMoisFcfa, totalFcfa,
    dateEcheance, datePaiement, statut,
  } = props

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.titre}>QUITTANCE DE LOYER</Text>
        <Text style={S.sousTitre}>Periode : {formatMois(mois)}</Text>
        <Text style={S.ref}>
          Ref: {quittanceId.slice(0, 8).toUpperCase()} — Contrat: {contratId.slice(0, 8).toUpperCase()}
        </Text>

        {/* Statut */}
        <View style={S.statutBox}>
          <Text>Statut : {statutLabel(statut)}</Text>
          {datePaiement ? <Text>Paye le : {datePaiement}</Text> : null}
        </View>

        {/* Parties */}
        <View style={S.section}>
          <Text style={S.sectionH}>PARTIES</Text>
          <View style={S.row}>
            <Text style={S.label}>Bailleur :</Text>
            <Text style={S.value}>{bailleurNom}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Tel bailleur :</Text>
            <Text style={S.value}>{bailleurTel}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Preneur :</Text>
            <Text style={S.value}>{preneurNom}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Tel preneur :</Text>
            <Text style={S.value}>{preneurTel}</Text>
          </View>
        </View>

        {/* Bien loue */}
        <View style={S.section}>
          <Text style={S.sectionH}>BIEN LOUE</Text>
          <View style={S.row}>
            <Text style={S.label}>Adresse :</Text>
            <Text style={S.value}>{bienAdresse}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Commune :</Text>
            <Text style={S.value}>{bienCommune}</Text>
          </View>
        </View>

        {/* Detail montants */}
        <View style={S.section}>
          <Text style={S.sectionH}>DETAIL DES MONTANTS</Text>
          <View style={S.row}>
            <Text style={S.label}>Loyer mensuel :</Text>
            <Text style={S.value}>{loyerMoisFcfa.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Charges :</Text>
            <Text style={S.value}>{chargesMoisFcfa.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Date d&apos;echeance :</Text>
            <Text style={S.value}>{dateEcheance}</Text>
          </View>
        </View>

        {/* Total a payer — montant en chiffres ET en lettres */}
        <View style={S.section}>
          <Text style={S.sectionH}>TOTAL A PAYER</Text>
          <Text style={S.montant}>{totalFcfa.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={S.montantLet}>Soit : {montantEnLettres(totalFcfa)}</Text>
        </View>

        {/* Signatures */}
        <View style={S.signatures}>
          <View style={S.sigBox}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>Signature du bailleur</Text>
            <Text style={{ fontSize: 9, marginTop: 20 }}>{bailleurNom}</Text>
          </View>
          <View style={S.sigBox}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>Cachet / Date</Text>
            <Text style={{ fontSize: 9, marginTop: 20 }}>
              {new Date().toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <Text style={S.footer}>
          Document genere automatiquement — Immo CI Platform — {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  )
}
