# 🔒 SECURITY HARDENING PLAN

**Status**: Phase 1 In Progress
**Goal**: 100% API auth coverage
**Total Routes**: 37

## Completed
- [x] /admin/contact-requests/[id]/validate - DONE

## TODO: 17 Critical Routes

### Phase 1: Admin Routes (2 remaining)
- /admin/reservations/[id]/validate
- /admin/visites/[id]/validate

### Phase 2: Owner Routes (9)
- /biens/[id]/broadcast
- /biens/[id]/medias
- /biens/[id] (PATCH + DELETE)
- /contrats/* (2)
- /quittances/* (2)
- /upload/sign

### Phase 3: User Routes (6)
- /avis, /avis/[id]/reponse
- /kyc, /notifications
- /paiements/initier
- /visites validation

## Pattern
All routes use:
- requireAuth() for authentication
- requireAdmin() or requireOwnership() for authorization
- safeErrorResponse() for error handling
- Try-catch wrapping

## Timeline
- Phase 1: 30 minutes
- Phase 2: 2-3 hours
- Phase 3: 1.5-2 hours
Total: ~5-6 hours

See API_AUTH_MIGRATION_CHECKLIST.md for detailed steps.
