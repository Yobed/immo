# API Authentication Pattern

## Overview

All API routes that modify data or access user-specific information must verify authentication and ownership.

## Quick Start

### Pattern 1: Require Owner of Resource

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOwnership, safeErrorResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require auth
    const { user } = await requireAuth(req)
    const { id } = await params

    // 2. Fetch resource
    const supabase = await createClient()
    const { data: resource } = await (supabase as any)
      .from('biens')
      .select('proprietaire_id')
      .eq('id', id)
      .single()

    // 3. Check ownership
    requireOwnership(resource?.proprietaire_id, user.id)

    // 4. Proceed with operation
    const body = await req.json()
    const { data } = await (supabase as any)
      .from('biens')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    return NextResponse.json(data)
  } catch (error) {
    return safeErrorResponse(error)
  }
}
```

### Pattern 2: Require Admin

```typescript
import { requireAuth, requireAdmin, safeErrorResponse } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  try {
    // 1. Require auth
    const { user } = await requireAuth(req)

    // 2. Require admin
    await requireAdmin(user.id)

    // 3. Proceed
    // ...
  } catch (error) {
    return safeErrorResponse(error)
  }
}
```

### Pattern 3: Public Route (No Auth Required)

```typescript
export async function GET(req: NextRequest) {
  // No auth check — route is public
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('biens')
    .select('*')
    .eq('statut', 'publie')

  return NextResponse.json(data)
}
```

## Available Functions

### `requireAuth(request: NextRequest): Promise<AuthContext>`
- Extracts and validates user from request
- Throws `NextResponse` with 401 if not authenticated
- Returns `{ user, request }`

### `requireOwnership(proprietaireId: string, userId: string): void`
- Checks `proprietaireId === userId`
- Throws `NextResponse` with 403 if not owner

### `requireAdmin(userId: string): Promise<void>`
- Queries `profiles.role` from Supabase
- Throws `NextResponse` with 403 if not admin

### `safeErrorResponse(error: unknown, statusCode?: number): NextResponse`
- Logs full error server-side (in DEBUG mode)
- Returns generic error message to client
- Default status: 500

## Routes Requiring Auth

### Must Check Authentication:
- ✅ POST `/api/biens` — Create property (owner)
- ✅ PATCH `/api/biens/[id]` — Update property (owner)
- ✅ DELETE `/api/biens/[id]` — Delete property (owner)
- ✅ POST `/api/biens/[id]/upload` — Upload media (owner)
- ✅ POST `/api/biens/[id]/description` — AI description (owner)
- ✅ POST `/api/biens/[id]/score` — AI scoring (owner)
- ✅ POST `/api/reservations` — Book visit (user)
- ✅ POST `/api/visites` — Request visit (user)
- ✅ POST `/api/avis` — Leave review (user)
- ✅ POST `/api/favoris` — Add favorite (user)
- ✅ POST `/api/admin/*` — Admin operations (admin only)

### Public Routes (No Auth):
- ✅ GET `/api/biens` — List properties
- ✅ GET `/api/biens/[id]` — Property details
- ✅ GET `/api/catalogue` — Browse catalog

## Migration Checklist

- [ ] Update PATCH /api/biens/[id]/description
- [ ] Update PATCH /api/biens/[id]/score
- [ ] Update POST /api/biens/[id]/upload
- [ ] Update all POST /api/reservations*
- [ ] Update all POST /api/visites*
- [ ] Update all POST /api/avis*
- [ ] Update all POST /api/admin/*
- [ ] Add auth to DELETE /api/biens/[id]
- [ ] Add auth to PATCH /api/biens/[id]

## Error Handling

All routes must wrap in try-catch and return `safeErrorResponse()`:

```typescript
try {
  // operation
  return NextResponse.json(data)
} catch (error) {
  return safeErrorResponse(error)
}
```

This ensures:
- 401 Unauthorized if auth fails (throws from requireAuth)
- 403 Forbidden if ownership/role fails (throws from require*)
- 500 Internal Error for unexpected failures
- Generic error messages returned to client
- Full error details logged server-side (DEBUG mode)
