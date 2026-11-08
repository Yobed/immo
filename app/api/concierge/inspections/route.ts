import { NextRequest, NextResponse } from 'next/server';
import { 
  getLiveProperties, 
  getLiveInspections, 
  recordConciergeInspection 
} from '@/lib/properties-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inspections = getLiveInspections();
    const properties = getLiveProperties();
    return NextResponse.json({
      success: true,
      inspections,
      properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur GET /api/concierge/inspections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.property_id || !body.inspector_name) {
      return NextResponse.json(
        { success: false, error: 'Propriété et nom du concierge requis' },
        { status: 400 }
      );
    }

    const result = recordConciergeInspection({
      property_id: body.property_id,
      property_title: body.property_title || 'Propriété',
      property_reference: body.property_reference || 'REF-PRESTIGE',
      inspector_name: body.inspector_name,
      inspector_phone: body.inspector_phone || '+2250788421920',
      inspector_role: body.inspector_role || 'Concierge Terrain',
      started_at: body.started_at,
      completed_at: body.completed_at,
      duration_minutes: body.duration_minutes,
      check_status: body.check_status || 'ready',
      availability_status: body.availability_status || 'available',
      cleaning_grade: body.cleaning_grade || 'impeccable',
      checklist: body.checklist || {
        cleaning: true,
        linen: true,
        ac_electricity: true,
        plumbing: true,
        keys_security: true,
        welcome_kit: true,
      },
      zone_details: body.zone_details || [],
      notes: body.notes || '',
      issues: body.issues || [],
      photos: body.photos || [],
      signature: body.signature || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Inspection enregistrée et écosystème synchronisé',
      property: result.property,
      inspection: result.inspection,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur POST /api/concierge/inspections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur enregistrement inspection' },
      { status: 500 }
    );
  }
}
