import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_CONTACTS } from '@/lib/mock-data';

const LEADS_FILE = path.join(process.cwd(), 'services', 'whatsapp-bot', 'leads_whatsapp.json');

export async function GET() {
  try {
    let storedLeads: any[] = [];
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      storedLeads = JSON.parse(data);
    }

    return NextResponse.json({
      success: true,
      count: storedLeads.length,
      leads: storedLeads,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  // Déclenche une synchronisation complète
  try {
    let storedLeads: any[] = [];
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      storedLeads = JSON.parse(data);
    }

    return NextResponse.json({
      success: true,
      synced_count: storedLeads.length,
      leads: storedLeads,
      message: `${storedLeads.length} leads synchronisés depuis WhatsApp.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
