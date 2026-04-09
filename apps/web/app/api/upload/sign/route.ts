import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { signUploadParams } from '@/lib/cloudinary'

export async function POST(request: Request) {
  const { user } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { paramsToSign } = await request.json()
  const signature = signUploadParams(paramsToSign)
  return NextResponse.json({ signature })
}
