import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { generatePdfFromUrl } from '@/lib/pdf-generator';
import { convertPdfToFlipbook } from '@/lib/heyzine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, pushToHeyzine } = body;

    const host = req.headers.get('host') || 'localhost:3001';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';

    // Cas spécial : Génération du Catalogue Général Complet
    if (propertyId === 'catalogue' || propertyId === 'all') {
      const brochurePageUrl = `${protocol}://${host}/brochure/catalogue`;
      const filename = 'CATALOGUE-PRESTIGE-ABIDJAN-2026.pdf';
      const outputPath = path.join(process.cwd(), 'public', 'brochures', filename);

      await generatePdfFromUrl({
        url: brochurePageUrl,
        outputPath,
      });

      return NextResponse.json({
        success: true,
        reference: 'CATALOGUE-2026',
        pdfUrl: `/brochures/${filename}`,
        fullUrl: `${protocol}://${host}/brochures/${filename}`,
      });
    }

    const property = INITIAL_PROPERTIES.find((p) => p.id === propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Propriété introuvable' }, { status: 404 });
    }

    const brochurePageUrl = `${protocol}://${host}/brochure/${property.id}`;

    const filename = `${property.reference}.pdf`;
    const outputPath = path.join(process.cwd(), 'public', 'brochures', filename);

    // 1. Génération du PDF vectoriel haute définition
    await generatePdfFromUrl({
      url: brochurePageUrl,
      outputPath,
    });

    const publicPdfUrl = `/brochures/${filename}`;
    let heyzineResult = null;

    // 2. Envoi optionnel vers Heyzine via l'API
    if (pushToHeyzine) {
      try {
        const fullPdfUrl = `${protocol}://${host}${publicPdfUrl}`;
        heyzineResult = await convertPdfToFlipbook({
          pdfUrl: fullPdfUrl,
          title: `Plaquette - ${property.title}`,
          subtitle: `${property.district} • ${property.reference}`,
          description: property.description,
          allowDownload: true,
        });
      } catch (heyzineErr: any) {
        console.warn('Heyzine push warning:', heyzineErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      reference: property.reference,
      pdfUrl: publicPdfUrl,
      fullUrl: `${protocol}://${host}${publicPdfUrl}`,
      heyzine: heyzineResult,
    });
  } catch (err: any) {
    console.error('Erreur génération brochure:', err);
    return NextResponse.json(
      { error: err.message || 'Échec de la génération de la brochure' },
      { status: 500 }
    );
  }
}
