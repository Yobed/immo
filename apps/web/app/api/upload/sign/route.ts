import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signUploadParams } from '@/lib/cloudinary'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { paramsToSign } = await request.json()
  const signature = signUploadParams(paramsToSign)
  return NextResponse.json({ signature })
}
