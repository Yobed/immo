-- Migration 010: Automatisation de la disponibilité des biens
-- Dépendances: 002_biens, 004_reservations

-- Fonction pour mettre à jour la disponibilité du bien
create or replace function public.handle_reservation_availability()
returns trigger as $$
begin
  -- Si une réservation passe en statut 'confirmee', le bien devient indisponible
  if (new.statut = 'confirmee') then
    update public.biens
    set est_disponible = false
    where id = new.bien_id;
  end if;

  -- Si une réservation est 'annulee', le bien redeviendrait théoriquement disponible
  -- NOTE: On pourrait l'automatiser ici, mais il est plus sûr que le propriétaire 
  -- re-vérifie manuellement ou que d'autres réservations en attente soient gérées.
  -- Pour l'instant on se concentre sur l'assurance que le bien est MARQUÉ comme loué.

  return new;
end;
$$ language plpgsql security definer;

-- Trigger sur INSERT ou UPDATE de la table reservations
create trigger tr_reservation_availability
  after insert or update of statut on public.reservations
  for each row
  execute function public.handle_reservation_availability();

comment on function public.handle_reservation_availability() is 'Bascule est_disponible à false quand une réservation est confirmée.';
