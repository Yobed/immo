import { SignJWT, jwtVerify } from 'jose'

const TTL_DAYS = 7

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SIGNING_SECRET missing or too short (>=32 chars required)')
  }
  return new TextEncoder().encode(secret)
}

export interface MagicLinkPayload {
  bien_id: string
  user_id: string
  phone: string
}

export async function signMagicLinkToken(payload: MagicLinkPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(getSecret())
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      typeof payload.bien_id === 'string' &&
      typeof payload.user_id === 'string' &&
      typeof payload.phone === 'string'
    ) {
      return { bien_id: payload.bien_id, user_id: payload.user_id, phone: payload.phone }
    }
    return null
  } catch {
    return null
  }
}
