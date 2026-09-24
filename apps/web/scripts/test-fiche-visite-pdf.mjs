import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { FicheVisiteDocument } from '../lib/fiche-visite-pdf.tsx';

async function testPdf() {
  console.log('Testing FicheVisiteDocument PDF render...');
  const buffer = await renderToBuffer(
    createElement(FicheVisiteDocument, {
      ficheNum: 'BV-TEST1234',
      dateEdition: '24/09/2026',
      prospectNom: 'Kouassi Jean-Marc',
      prospectTel: '+225 07 01 02 03 04',
      prospectEmail: 'kouassi@example.com',
      prospectCritere: 'Villa 4 pièces · Bingerville',
      prospectBudget: '250 000 FCFA',
      dateVisite: 'vendredi 25 septembre 2026',
      creneauHoraire: '10:00 - 11:30',
      commercialNom: 'Wilfried Bogbe',
      commercialTel: '+225 07 48 48 37 37',
      biens: [
        {
          ref: 'BOGB-001',
          titre: 'Villa 4 pièces avec grande cour',
          typeBien: 'villa',
          localisation: 'Bingerville · Feh Kessé',
          prixLabel: '250 000 FCFA/mois',
          observations: 'Très bon état, cour arborée',
        },
      ],
      notesVisite: 'Le client recherche pour emménager fin du mois.',
    })
  );

  console.log('✓ PDF generated successfully!');
  console.log('Buffer size:', buffer.byteLength, 'bytes');
  if (buffer.byteLength < 5000) {
    throw new Error('PDF output is suspiciously small');
  }
}

testPdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
