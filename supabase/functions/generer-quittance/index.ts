// supabase/functions/generer-quittance/index.ts
// Edge Function Deno — coordinateur de generation de quittances
// NOTE: @react-pdf/renderer n'est pas disponible dans Deno.
// Cette Edge Function delègue la generation PDF a l'API Next.js /api/quittances/generer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contratId, mois } = await req.json() as { contratId: string; mois?: string }

    if (!contratId) {
      return new Response(
        JSON.stringify({ error: 'contratId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Appel a l'API Next.js qui gere react-pdf (non disponible en Deno)
    // Pattern: Edge Function = coordinator, Next.js API = PDF generator
    const nextApiUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://your-app.vercel.app'
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const response = await fetch(`${nextApiUrl}/api/quittances/generer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': serviceKey,  // shared secret pour authentifier l'Edge Function
      },
      body: JSON.stringify({ contratId, mois }),
    })

    const result = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: result.error ?? 'Erreur generation quittance' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
