/**
 * Image distante → data URI pour les opengraph-image (Satori/edge).
 *
 * Pourquoi : quand on passe une URL distante à <img> dans ImageResponse,
 * c'est Satori qui la télécharge — sans timeout ni limite. Une photo de
 * plusieurs Mo ou un host lent fait planter le rendu EN SILENCE : la route
 * répond 200 avec un corps VIDE → aucune preview photo sur WhatsApp/Facebook.
 *
 * Ici on télécharge nous-mêmes avec timeout + plafond de taille, on réduit
 * via Cloudinary quand possible, et on rend null en cas de pépin — la carte
 * OG s'affiche alors sans photo (prix + commune) plutôt que pas du tout.
 */
export async function fetchOgImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null

  // Cloudinary : version aux dimensions exactes du canevas OG (800x420),
  // compressée JPEG — fetch + encodage PNG plus rapides (budget aperçu WhatsApp ~3 s)
  const src =
    url.includes('res.cloudinary.com') && url.includes('/upload/')
      ? url.replace('/upload/', '/upload/w_800,h_420,c_fill,q_60,f_jpg/')
      : url

  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(4000) })
    if (!r.ok) return null
    const ct = (r.headers.get('content-type') ?? '').split(';')[0].trim()
    // Formats supportés par Satori (pas de webp/avif)
    if (!/^image\/(jpe?g|png|gif)$/.test(ct)) return null
    const buf = await r.arrayBuffer()
    if (buf.byteLength === 0 || buf.byteLength > 2_500_000) return null
    return `data:${ct};base64,${toBase64(buf)}`
  } catch {
    return null
  }
}

// btoa ne prend pas d'ArrayBuffer ; conversion par blocs pour éviter
// un dépassement de pile avec String.fromCharCode(...bigArray).
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}
