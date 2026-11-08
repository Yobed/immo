import { NextResponse } from 'next/server';
import { getLiveProperties } from '@/lib/properties-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const properties = getLiveProperties();
    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur API /api/properties:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
