/**
 * Server-side Authentication Utilities
 * Centralized auth checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export interface AuthContext {
  user: User
  request: NextRequest
}

/**
 * Extract and validate user from request
 * @returns User object or null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    return null
  }
}

/**
 * Require authentication for an API route
 * Returns 401 if user is not authenticated
 * @throws NextResponse with 401 status
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const user = await getAuthUser(request)

  if (!user) {
    throw NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return { user, request }
}

/**
 * Require user to own the resource
 * Checks that resource.proprietaire_id === user.id
 */
export function requireOwnership(
  proprietaireId: string | null | undefined,
  userId: string
): void {
  if (!proprietaireId || proprietaireId !== userId) {
    throw NextResponse.json(
      { error: 'Forbidden: you do not own this resource' },
      { status: 403 }
    )
  }
}

/**
 * Require admin role
 * Checks that user has role = 'admin' in profiles table
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw NextResponse.json(
      { error: 'Forbidden: admin access required' },
      { status: 403 }
    )
  }
}

/**
 * Require specific role
 */
export async function requireRole(
  userId: string,
  requiredRole: string
): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role !== requiredRole) {
    throw NextResponse.json(
      { error: `Forbidden: ${requiredRole} access required` },
      { status: 403 }
    )
  }
}

/**
 * Safe error response for API routes
 * Don't expose error details to client in production
 */
export function safeErrorResponse(error: unknown, statusCode = 500) {
  if (error instanceof NextResponse) {
    return error
  }

  const message =
    error instanceof Error ? error.message : 'An error occurred'

  // Log full error server-side
  if (process.env.DEBUG) {
    console.error('[API Error]', error)
  }

  // Return generic message to client
  return NextResponse.json(
    { error: 'Request failed' },
    { status: statusCode }
  )
}
