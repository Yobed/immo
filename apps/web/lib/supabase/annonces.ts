import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Annonces scrapees sur les sites immo publics (coinafrique...), projet Supabase
// dedie. Interet vs les offres flash WhatsApp : ces annonces ont de VRAIES PHOTOS
// rapatriees dans notre Storage (bucket `annonces-photos`), donc credibles pour
// le prospect. Cf. scripts/rapatrier-photos.mjs.
const ANNONCES_URL = 'https://rvehvcovkrcykobvenbg.supabase.co'

let _client: SupabaseClient | null = null

/**
 * Client lecture vers le projet scraping. On passe par la service_role et non
 * une cle anon (contrairement a locaux.ts) : la base n'expose pas de cle
 * publique et RLS y est ferme. Sans danger tant que TOUS les appels restent
 * server-side — c'est le cas : consolidated.ts (Server Components) et
 * lib/ai/tools.ts (route API Sapphire).
 */
export function createAnnoncesClient(): SupabaseClient {
  if (_client) return _client
  const key = process.env.SCRAPING_SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^\ufeff/, '')
  if (!key) throw new Error('SCRAPING_SUPABASE_SERVICE_ROLE_KEY missing')
  _client = createClient(process.env.SCRAPING_SUPABASE_URL?.trim() || ANNONCES_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Source': 'immo-ci-annonces' } },
  })
  return _client
}
