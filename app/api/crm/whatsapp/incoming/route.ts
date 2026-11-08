import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseWhatsAppMessage } from '@/lib/whatsapp-crm-parser';
import { INITIAL_CONTACTS } from '@/lib/mock-data';
import { Contact, WhatsAppMessage } from '@/lib/types';

const LEADS_FILE = path.join(process.cwd(), 'services', 'whatsapp-bot', 'leads_whatsapp.json');

// Helper pour lire les leads persistés
function getStoredLeads(): any[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[API WhatsApp Incoming] Erreur lecture fichier leads :', err);
  }
  return [];
}

// Helper pour sauvegarder les leads
function saveStoredLeads(leads: any[]) {
  try {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('[API WhatsApp Incoming] Erreur écriture fichier leads :', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      phone, 
      senderName, 
      text, 
      timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 
      botReply 
    } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: 'phone et text sont requis' }, { status: 400 });
    }

    const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Rechercher dans les contacts existants
    const existingMock = INITIAL_CONTACTS.find(c => 
      c.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
    );

    const storedLeads = getStoredLeads();
    const existingStored = storedLeads.find(l => 
      l.phone && l.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
    );

    const baseContact = existingStored || existingMock;

    // Analyse et qualification sémantique par le parseur NLP
    const analysis = parseWhatsAppMessage(
      cleanPhone, 
      text, 
      senderName || baseContact?.full_name || 'Prospect WhatsApp',
      baseContact
    );

    // Préparer les nouveaux messages pour l'historique
    const newClientMsg: WhatsAppMessage = {
      id: `wa-in-${Date.now()}-c`,
      sender: 'client',
      sender_name: analysis.fullName || 'Client',
      timestamp: `Aujourd'hui ${timestamp}`,
      text: text,
      status: 'read'
    };

    const history: WhatsAppMessage[] = baseContact?.whatsapp_history ? [...baseContact.whatsapp_history] : [];
    history.push(newClientMsg);

    if (botReply) {
      history.push({
        id: `wa-in-${Date.now()}-a`,
        sender: 'agent',
        sender_name: 'Aya (Agent IA Cabinet)',
        timestamp: `Aujourd'hui ${timestamp}`,
        text: botReply,
        status: 'read'
      });
    }

    // Créer ou enrichir la fiche contact CRM
    const updatedContact: Contact = {
      id: baseContact?.id || `cont-wa-${Date.now()}`,
      full_name: analysis.fullName || 'Prospect WhatsApp',
      phone: cleanPhone,
      email: baseContact?.email || `${cleanPhone.replace(/[^0-9]/g, '')}@lead-whatsapp.ci`,
      type: analysis.type || 'tenant',
      lead_score: analysis.leadScore,
      qualification_score: analysis.qualificationScore,
      budget_min: analysis.budgetMin || baseContact?.budget_min || 1800000,
      budget_max: analysis.budgetMax || baseContact?.budget_max || 2500000,
      preferred_districts: analysis.preferredDistricts || ['Cocody Riviera Golf'],
      preferred_types: analysis.preferredTypes || ['villa'],
      profession: baseContact?.profession || 'Cadre Dirigeant / Relocation Abidjan',
      residence_country: baseContact?.residence_country || 'Côte d\'Ivoire (Abidjan)',
      financial_readiness: baseContact?.financial_readiness || 'Solvabilité en cours de validation automatique par Aya IA',
      kyc_status: baseContact?.kyc_status || 'pending',
      timeline: analysis.timeline || 'immediate',
      key_interests: analysis.keyInterests,
      notes: `${baseContact?.notes ? baseContact.notes + ' • ' : ''}Remonté depuis WhatsApp en direct : ${analysis.summary}`,
      last_interaction: `Aujourd'hui ${timestamp} via WhatsApp • ${analysis.summary}`,
      source: 'whatsapp',
      created_at: baseContact?.created_at || new Date().toISOString(),
      objections: analysis.objectionsDetected,
      whatsapp_history: history,
      lease_status: baseContact?.lease_status || (analysis.type === 'tenant' ? 'candidate' : undefined)
    };

    // Sauvegarder dans le fichier de leads partagé
    const existingIdx = storedLeads.findIndex(l => 
      l.phone && l.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
    );

    if (existingIdx >= 0) {
      storedLeads[existingIdx] = updatedContact;
    } else {
      storedLeads.unshift(updatedContact);
    }
    saveStoredLeads(storedLeads);

    console.log(`[CRM Webhook] ✅ Lead WhatsApp remonté avec succès : ${updatedContact.full_name} (${cleanPhone}) - Score: ${updatedContact.qualification_score}%`);

    return NextResponse.json({
      success: true,
      contact: updatedContact,
      extracted_entities: analysis,
      visit_created: Boolean(analysis.visitRequest?.requested)
    });

  } catch (err: any) {
    console.error('[API WhatsApp Incoming Error]', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}
