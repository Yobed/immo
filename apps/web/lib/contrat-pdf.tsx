// lib/contrat-pdf.tsx
// Contrat de bail OHADA — @react-pdf/renderer
// IMPORTANT: Ce fichier est importe uniquement depuis des routes serveur
// (serverExternalPackages garantit le bon module resolution)

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ToWords } from 'to-words'

// RESA-05 : currency:false obligatoire — currency:true genere "euros" (mauvais)
const toWords = new ToWords({
  localeCode:       'fr-FR',
  converterOptions: { currency: false },
})

/** Convertit un montant entier FCFA en lettres francaises */
export function montantEnLettres(montant: number): string {
  return `${toWords.convert(Math.round(montant))} francs CFA`
  // Ex: 500000 -> "cinq cent mille francs CFA"
}

export interface ContratProps {
  contratId:     string
  reservationId: string
  dateDebut:     string
  dateFin:       string
  // Bailleur
  bailleurNom:   string
  bailleurCni:   string
  bailleurTel:   string
  // Preneur
  preneurNom:    string
  preneurCni:    string
  preneurTel:    string
  // Bien
  bienAdresse:   string
  bienCommune:   string
  surfaceM2:     number
  nbPieces:      number
  // Financier
  loyerMoisFcfa:      number
  chargesMoisFcfa:    number
  depotGarantieFcfa:  number
  // Date de signature
  dateSignature: string
  lieuSignature: string
}

const S = StyleSheet.create({
  page:       { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#1C2833' },
  titre:      { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  sousTitre:  { fontSize: 10, textAlign: 'center', marginBottom: 20, color: '#7F8C8D' },
  section:    { marginBottom: 14 },
  sectionH:   { fontSize: 11, fontWeight: 'bold', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E5E8EC', paddingBottom: 3 },
  ligne:      { marginBottom: 4, lineHeight: 1.5 },
  gras:       { fontFamily: 'Helvetica-Bold' },
  montant:    { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  montantLet: { fontStyle: 'italic', color: '#1A5276' },
  footer:     { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#7F8C8D' },
  signatures: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' },
  sigBox:     { width: '45%', borderTopWidth: 1, borderTopColor: '#1C2833', paddingTop: 8 },
})

export function ContratDocument(props: ContratProps) {
  const {
    bailleurNom, bailleurCni, bailleurTel,
    preneurNom,  preneurCni,  preneurTel,
    bienAdresse, bienCommune, surfaceM2, nbPieces,
    loyerMoisFcfa, chargesMoisFcfa, depotGarantieFcfa,
    dateDebut, dateFin, dateSignature, lieuSignature,
  } = props

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tete */}
        <Text style={S.titre}>CONTRAT DE BAIL D&apos;HABITATION</Text>
        <Text style={S.sousTitre}>
          Regi par la loi ivoirienne et les dispositions de l&apos;Acte Uniforme OHADA
        </Text>

        {/* Identite des parties — RESA-04 */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 1 — PARTIES CONTRACTANTES</Text>
          <Text style={S.ligne}>
            <Text style={S.gras}>BAILLEUR : </Text>{bailleurNom} — CNI n° {bailleurCni} — Tel : {bailleurTel}
          </Text>
          <Text style={S.ligne}>
            <Text style={S.gras}>PRENEUR : </Text>{preneurNom} — CNI n° {preneurCni} — Tel : {preneurTel}
          </Text>
        </View>

        {/* Description du bien — RESA-04 */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 2 — DESIGNATION DU BIEN LOUE</Text>
          <Text style={S.ligne}>
            Appartement / Villa situe(e) a : <Text style={S.gras}>{bienAdresse}</Text>
          </Text>
          <Text style={S.ligne}>Commune : {bienCommune}</Text>
          <Text style={S.ligne}>Surface : {surfaceM2} m² — {nbPieces} piece(s)</Text>
        </View>

        {/* Duree du bail — RESA-04 */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 3 — DUREE DU BAIL</Text>
          <Text style={S.ligne}>Le present contrat prend effet le <Text style={S.gras}>{dateDebut}</Text></Text>
          <Text style={S.ligne}>et se termine le <Text style={S.gras}>{dateFin}</Text></Text>
        </View>

        {/* Loyer en chiffres ET en lettres — RESA-05 CRITIQUE */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 4 — LOYER ET CHARGES</Text>
          <Text style={S.montant}>
            Loyer mensuel : {loyerMoisFcfa.toLocaleString('fr-FR')} FCFA
          </Text>
          <Text style={S.montantLet}>
            Soit : {montantEnLettres(loyerMoisFcfa)}
          </Text>
          {chargesMoisFcfa > 0 && (
            <>
              <Text style={[S.ligne, { marginTop: 4 }]}>
                Charges mensuelles : {chargesMoisFcfa.toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={S.montantLet}>Soit : {montantEnLettres(chargesMoisFcfa)}</Text>
            </>
          )}
        </View>

        {/* Depot de garantie — RESA-04 */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 5 — DEPOT DE GARANTIE</Text>
          <Text style={S.montant}>
            Montant : {depotGarantieFcfa.toLocaleString('fr-FR')} FCFA
          </Text>
          <Text style={S.montantLet}>Soit : {montantEnLettres(depotGarantieFcfa)}</Text>
          <Text style={[S.ligne, { marginTop: 4 }]}>
            Le depot de garantie sera restitue dans un delai de 30 jours apres la remise des cles,
            deduction faite des sommes dues au titre de deteriorations eventuelles.
          </Text>
        </View>

        {/* Clauses resolutoires — RESA-04 */}
        <View style={S.section}>
          <Text style={S.sectionH}>ARTICLE 6 — RESILIATION ET CONGES</Text>
          <Text style={S.ligne}>
            Le present contrat pourra etre resilie par l&apos;une ou l&apos;autre des parties,
            moyennant un preavis d&apos;un (1) mois notifie par ecrit.
            En cas de non-paiement du loyer ou des charges a leur echeance, le present contrat
            sera resilie de plein droit apres mise en demeure restee sans effet pendant quinze (15) jours.
          </Text>
        </View>

        {/* Signatures */}
        <View style={S.signatures}>
          <View style={S.sigBox}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>LE BAILLEUR</Text>
            <Text style={{ fontSize: 9 }}>{bailleurNom}</Text>
            <Text style={{ fontSize: 8, color: '#7F8C8D', marginTop: 20 }}>Signature :</Text>
          </View>
          <View style={S.sigBox}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>LE PRENEUR</Text>
            <Text style={{ fontSize: 9 }}>{preneurNom}</Text>
            <Text style={{ fontSize: 8, color: '#7F8C8D', marginTop: 20 }}>Signature :</Text>
          </View>
        </View>

        <Text style={{ marginTop: 16, fontSize: 9, textAlign: 'center', color: '#7F8C8D' }}>
          Fait a {lieuSignature}, le {dateSignature}
        </Text>

        <Text style={S.footer}>
          BOGBE'S GROUPE — Plateforme immobiliere Cote d&apos;Ivoire — www.bogbesgroup.com
        </Text>
      </Page>
    </Document>
  )
}
