# ✅ API AUTH MIGRATION CHECKLIST

**Status**: Phase 1 (Admin Routes) In Progress  
**Completed**: 1/18 critical routes  
**Pattern**: Established and working  

---

## 🎯 COMPLETED

### Admin Routes (1/3) ✅
- [x] `POST /admin/contact-requests/[id]/validate` — Refactored
  - Uses `requireAuth()` + `requireAdmin()`
  - Proper error handling with `safeErrorResponse()`
  - TypeScript: PASSING ✅

### TO DO: 17 Routes Remaining

---

## 📋 PHASE 1: ADMIN ROUTES (Remaining 2)

Priority: CRITICAL (Business operations)

### Route: `/admin/reservations/[id]/validate`
**Current**: Has inline admin check  
**Action**: Refactor to use `requireAdmin()`  
**Pattern**: Same as contact-requests  

```bash
# Test after migration:
curl -X POST https://immo-sigma.vercel.app/api/admin/reservations/123/validate \
  -H "Authorization: Bearer TEST_TOKEN"
# Should return 403 (requires admin)
```

### Route: `/admin/visites/[id]/validate`
**Current**: Has inline admin check  
**Action**: Refactor to use `requireAdmin()`  
**Pattern**: Same as contact-requests  

---

## 📋 PHASE 2: OWNER MODIFICATION ROUTES (9 Routes)

Priority: HIGH (Modify user data)

### Biens Routes (5)
- `POST /biens/[id]/broadcast` — Owner only
- `GET /biens/[id]/medias` — Owner only
- `PATCH /biens/[id]` — Owner only
- `DELETE /biens/[id]` — Owner only
- `POST /upload/sign` — User only

### Contract Routes (2)
- `POST /contrats/[id]` — Owner only
- `POST /contrats/generer` — Owner only

### Invoice Routes (2)
- `POST /quittances/[id]` — Owner only
- `POST /quittances/generer` — Owner only

**Pattern for Owner Routes**:
```typescript
const { user } = await requireAuth(req)
const supabase = await createClient()
const { data: resource } = await supabase
  .from('table')
  .select('owner_id')
  .eq('id', id)
  .single()

requireOwnership(resource?.owner_id, user.id)
```

---

## 📋 PHASE 3: USER CREATION ROUTES (6 Routes)

Priority: MEDIUM (User-created records)

- `POST /avis` — Create review
- `POST /avis/[id]/reponse` — Reply to review
- `POST /contact-requests` — ✅ Already has auth (check)
- `POST /kyc` — KYC submission
- `POST /notifications/[id]` — Notification update
- `POST /paiements/initier` — Payment init
- `POST /reservations` — ✅ Already has auth (check)
- `POST /visites` — ✅ Already has auth (check)

**Pattern for User Routes**:
```typescript
const { user } = await requireAuth(req)
// No ownership check needed - user creating their own record
```

---

## 🚀 HOW TO MIGRATE A ROUTE

### Step 1: Backup
```bash
git checkout -b auth-migration/route-name
```

### Step 2: Replace Auth Logic
Find:
```typescript
import { getServerUser } from '@/lib/server-auth'
const { user, supabase } = await getServerUser(request)
if (!user) return NextResponse.json({...}, {status: 401})
if (profile?.role !== 'admin') return NextResponse.json({...}, {status: 403})
```

Replace with:
```typescript
import { requireAuth, requireAdmin, safeErrorResponse } from '@/lib/auth/server'
try {
  const { user } = await requireAuth(request)
  await requireAdmin(user.id)
  // ... rest of code
} catch (error) {
  return safeErrorResponse(error)
}
```

### Step 3: Test
```bash
npm run type-check  # Must pass
```

### Step 4: Commit
```bash
git add apps/web/app/api/path/to/route.ts
git commit -m "feat(auth): secure /api/path/to/route"
```

### Step 5: Verify
```bash
# Test without auth (should be 401)
curl -X POST https://immo-sigma.vercel.app/api/path/to/route

# Test with auth but wrong role/owner (should be 403)
curl -X POST https://immo-sigma.vercel.app/api/path/to/route \
  -H "Authorization: Bearer OTHER_USER_TOKEN"
```

---

## ⚙️ MIGRATION AUTOMATION

For faster migration, use this template:

**File: `apps/web/app/api/[path]/route.ts`**

```typescript
// Before: scattered auth checks + error handling
export async function POST(req: NextRequest) {
  const { user } = await getServerUser(req)
  if (!user) return {...401...}
  const { data: profile } = await supabase.from('profiles')...
  if (profile?.role !== 'admin') return {...403...}
  try {
    // ... operation
  } catch (e) {
    console.error(e)  // ❌ Don't do this
    return {...500...}
  }
}

// After: centralized + clean
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req)
    await requireAdmin(user.id)
    // ... operation
    return NextResponse.json(result)
  } catch (error) {
    return safeErrorResponse(error)
  }
}
```

---

## 📊 PROGRESS TRACKING

```
Phase 1: Admin Routes
├─ [x] /admin/contact-requests/[id]/validate
├─ [ ] /admin/reservations/[id]/validate
└─ [ ] /admin/visites/[id]/validate

Phase 2: Owner Routes
├─ [ ] /biens/[id]/broadcast
├─ [ ] /biens/[id]/medias
├─ [ ] /biens/[id] (PATCH)
├─ [ ] /biens/[id] (DELETE)
├─ [ ] /contrats/*
├─ [ ] /quittances/*
└─ [ ] /upload/sign

Phase 3: User Routes
├─ [ ] /avis
├─ [ ] /avis/[id]/reponse
├─ [ ] /kyc
├─ [ ] /notifications/[id]
├─ [ ] /paiements/initier
└─ [ ] /visites (verify)
```

---

## ✅ VERIFICATION AFTER ALL MIGRATIONS

```bash
# 1. Build check
npm run build

# 2. Type check
npm run type-check

# 3. Git status
git status  # Should show 18 new commits

# 4. Run E2E tests (if available)
npm run test:e2e
```

---

## 📌 NOTES

- Each route = 1 commit (easier to revert if needed)
- Pattern is identical for all routes
- No breaking changes for public routes
- All migrations use existing middleware (no new code)
- Estimated time: 15-20 minutes per route (5-6 hours total)

---

## 🎯 SUCCESS CRITERIA

When complete:
- ✅ All 18 critical routes have auth checks
- ✅ All routes use `requireAuth()` or `requireAdmin()`
- ✅ All routes use `safeErrorResponse()`
- ✅ No inline auth logic scattered across codebase
- ✅ TypeScript compiles (0 errors)
- ✅ Build passes
- ✅ 37/37 routes are secure

---

**Recommendation**: Complete Phase 1 (2 more routes) today, then Phase 2-3 over the next few days. Each developer can pick a route and follow this template.
