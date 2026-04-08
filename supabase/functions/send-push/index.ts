// supabase/functions/send-push/index.ts
// Edge Function Deno — envoi de notifications push via Expo Push Service
// Pattern: Expo Push Service (wrapper FCM/APNs géré par Expo)
// Le token stocké dans profiles.fcm_token est un ExponentPushToken[xxxxxx]
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendPushPayload {
  user_id: string
  title: string
  body: string
  data?: {
    lien_type?: 'bien' | 'reservation' | 'message'
    lien_id?: string
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, title, body, data }: SendPushPayload = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_id, title et body sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client Supabase avec service role pour lire le fcm_token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Récupérer le token push depuis profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', user_id)
      .single()

    if (profileError || !profile?.fcm_token) {
      return new Response(
        JSON.stringify({ error: 'Token push introuvable pour cet utilisateur', detail: profileError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Envoyer via Expo Push Service
    // Le token est au format "ExponentPushToken[xxxxxx]"
    const expoPushPayload = {
      to: profile.fcm_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushPayload),
    })

    const expoResult = await expoResponse.json()

    // Log dans la table notifications si elle existe
    await supabase.from('notifications').insert({
      user_id,
      titre: title,
      message: body,
      lien_type: data?.lien_type ?? null,
      lien_id: data?.lien_id ?? null,
      lu: false,
    }).then(() => {}).catch(() => {})
    // Ignore l'erreur si la table n'a pas les colonnes exactes — non bloquant

    return new Response(
      JSON.stringify({ success: true, expo_result: expoResult }),
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
