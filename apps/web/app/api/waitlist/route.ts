import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nom, contact, type_contact, profil, source } = body

    if (!contact || !type_contact) {
      return NextResponse.json(
        { error: 'Contact requis.' },
        { status: 400 }
      )
    }

    // Validation basique email
    if (type_contact === 'email') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(contact)) {
        return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
      }
    }

    // Validation téléphone (format CI : 07, 05, 01, 27, 25...)
    if (type_contact === 'whatsapp') {
      const stripped = contact.replace(/\s/g, '')
      if (stripped.length < 8) {
        return NextResponse.json({ error: 'Numéro invalide.' }, { status: 400 })
      }
    }

    const supabase = await createClient()

    // Upsert pour éviter les doublons
    const { error } = await (supabase as any)
      .from('waitlist')
      .upsert(
        {
          nom: nom?.trim() || null,
          contact: contact.trim(),
          type_contact,
          profil: profil || 'chercheur',
          source: source || 'landing',
        },
        { onConflict: 'contact' }
      )

    if (error) {
      // Doublon = succès silencieux
      if (error.code === '23505') {
        return NextResponse.json({ success: true, already: true })
      }
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
}
