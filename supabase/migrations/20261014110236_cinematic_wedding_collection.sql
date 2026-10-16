begin;

-- Register the new wedding designs so events.theme_id can reference them.
-- Existing theme records and saved invitations are preserved.
insert into public.themes (id, name, description) values
  ('aranya', 'Temple Dawn', 'Temple light and a peaceful garden wedding.'),
  ('riviera', 'Coastal Promise', 'Coastal light and a Mediterranean celebration.'),
  ('dastaan', 'Palace Reverie', 'A palace courtyard and a story told through scroll.'),
  ('meenaya', 'Jasmine & Gold', 'Warm temple light and a South Indian celebration.'),
  ('kesari', 'Midnight Marigold', 'Golden palace details and an evening celebration.'),
  ('haveli', 'Courtyard Letters', 'Terracotta courtyards and heritage warmth.')
on conflict (id) do nothing;

commit;
