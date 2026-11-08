import { NextRequest, NextResponse } from 'next/server';
import { convertPdfToFlipbook, listAccountFlipbooks } from '@/lib/heyzine';

export async function GET() {
  try {
    const flipbooks = await listAccountFlipbooks();
    return NextResponse.json({ success: true, count: flipbooks.length, flipbooks });
  } catch (err: any) {
    console.error('Erreur listing Heyzine:', err);
    return NextResponse.json(
      { error: err.message || 'Impossible de récupérer les flipbooks Heyzine' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfUrl, title, subtitle, description } = body;

    if (!pdfUrl || !title) {
      return NextResponse.json(
        { error: 'pdfUrl et title sont obligatoires.' },
        { status: 400 }
      );
    }

    const result = await convertPdfToFlipbook({
      pdfUrl,
      title,
      subtitle,
      description,
      allowDownload: true,
    });

    return NextResponse.json({ success: true, flipbook: result });
  } catch (err: any) {
    console.error('Erreur conversion Heyzine:', err);
    return NextResponse.json(
      { error: err.message || 'Échec de la conversion Heyzine' },
      { status: 500 }
    );
  }
}
