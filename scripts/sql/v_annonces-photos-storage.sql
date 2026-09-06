-- A EXECUTER SUR LE PROJET SCRAPING rvehvcovkrcykobvenbg (PAS sur la base de l'app).
-- Dashboard > SQL Editor > coller > Run.
--
-- Pourquoi : le scraper deduit les URLs image1..imageN d'apres nb_photos, mais certaines
-- n'existent pas chez coinafrique (S3 repond 403 definitif). v_annonces les exposait encore
-- en fallback sur url_source -> images cassees. La vue ne renvoie plus que les photos
-- reellement presentes dans le bucket, et nb_photos est recalcule en consequence.
-- Le prochain scrape recreera ces lignes fantomes : elles seront filtrees automatiquement.

create or replace view public.v_annonces as
select
  a.id, a.source, a.listing_id, a.url, a.titre, a.type_bien, a."transaction",
  a.commune, a.quartier, a.adresse, a.prix_fcfa, a.periodicite, a.prix_brut,
  a.devise, a.surface_m2, a.nb_pieces, a.nb_chambres, a.contact, a.description,
  coalesce(array_length(p.photos, 1), 0)::smallint as nb_photos,
  a.vu_le, a.maj_le, a.actif,
  p.photos[1]                       as photo_principale,
  coalesce(p.photos, '{}'::text[])  as photos
from public.annonces a
left join lateral (
  select array_agg(ph.url_publique order by ph.position nulls last, ph.id) as photos
  from public.annonce_photos ph
  where ph.annonce_id = a.id
    and ph.chemin_storage is not null   -- seule condition qui change
) p on true;

-- Si "cannot change name/type of view column" : decommenter la ligne suivante et relancer.
-- drop view public.v_annonces;
