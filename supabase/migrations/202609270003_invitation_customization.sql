begin;

-- Existing events retain their segment-based fallback. Customized invitations
-- are saved as one atomic document so theme/content/music never partially save.
alter table public.events
  add column invitation_content jsonb,
  add column music_enabled boolean not null default false,
  add constraint invitation_content_is_object check (
    invitation_content is null or (
      jsonb_typeof(invitation_content) = 'object'
      and octet_length(invitation_content::text) <= 65536
    )
  );

insert into public.themes (id, name, description) values
  ('mehfil', 'Mehfil', 'An intimate evening gathering with jewel-toned warmth.'),
  ('kesar', 'Kesar', 'Saffron sunshine and an expressive festive invitation.'),
  ('lotus', 'Lotus', 'Quiet botanical details and a serene celebration.'),
  ('pichwai', 'Pichwai', 'Original decorative details inspired by Indian garden paintings.'),
  ('ocean', 'Ocean', 'An airy coastal invitation with a cool contemporary palette.'),
  ('champagne', 'Champagne', 'A restrained, luminous invitation for an elegant evening.'),
  ('sindoor', 'Sindoor', 'A vivid red celebration with traditional warmth.');

-- Existing event RLS applies to both new columns: owner-only drafts/writes,
-- published content publicly readable. No service key or security definer path.
commit;
