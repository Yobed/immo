-- Migration 016: Policies relationnelles pour les accès légitimes aux profils
--
-- Contexte : la migration 015 a supprimé la policy USING(true) sur profiles.
-- Cela casse 3 cas d'usage légitimes :
--   1. Page bien publique → nom/avatar du propriétaire (accès anonyme OK)
--   2. Pro/visites → nom+téléphone du locataire (propriétaire authentifié)
--   3. Pro/ambassadeur → profils des filleuls parrainés
--
-- Sécurité maintenue : les colonnes phone/email ne sont JAMAIS demandées
-- dans les requêtes publiques (uniquement full_name, avatar_url).
-- Les routes admin utilisent createAdminClient() (service role, bypass RLS).

-- ─────────────────────────────────────────────────────────
-- 1. Pages publiques : nom + avatar du propriétaire d'un bien publié
--    Nécessaire pour afficher la fiche bien à des visiteurs non connectés.
-- ─────────────────────────────────────────────────────────
create policy "Propriétaire de bien publié visible publiquement"
  on public.profiles for select
  using (
    exists (
      select 1 from public.biens b
      where b.proprietaire_id = profiles.id
        and b.statut = 'publie'
    )
  );

-- ─────────────────────────────────────────────────────────
-- 2. Pro : propriétaire voit les locataires de ses visites
--    Nécessaire pour (pro)/visites — afficher qui a demandé une visite.
-- ─────────────────────────────────────────────────────────
create policy "Propriétaire voit locataires de ses visites"
  on public.profiles for select
  using (
    exists (
      select 1 from public.visites v
      join public.biens b on b.id = v.bien_id
      where v.locataire_id = profiles.id
        and b.proprietaire_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- 3. Pro : propriétaire voit les locataires de ses réservations
--    Nécessaire pour (pro)/reservations et génération de quittances.
-- ─────────────────────────────────────────────────────────
create policy "Propriétaire voit locataires de ses réservations"
  on public.profiles for select
  using (
    exists (
      select 1 from public.reservations r
      join public.biens b on b.id = r.bien_id
      where r.locataire_id = profiles.id
        and b.proprietaire_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- 4. Locataire voit le propriétaire de son bien (pour ses visites/réservations)
--    Nécessaire pour l'espace locataire.
-- ─────────────────────────────────────────────────────────
create policy "Locataire voit propriétaire de ses biens"
  on public.profiles for select
  using (
    exists (
      select 1 from public.visites v
      where v.proprietaire_id = profiles.id
        and v.locataire_id = auth.uid()
    )
    or exists (
      select 1 from public.reservations r
      join public.biens b on b.id = r.bien_id
      where b.proprietaire_id = profiles.id
        and r.locataire_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- 5. Ambassadeur : voir les filleuls qu'on a parrainés
-- ─────────────────────────────────────────────────────────
create policy "Parrain voit ses filleuls"
  on public.profiles for select
  using (parrain_id = auth.uid());
