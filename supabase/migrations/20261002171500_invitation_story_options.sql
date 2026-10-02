begin;

-- Publish the host-selected portrait, family, countdown and film settings.
-- Existing publication checks and restricted function filtering stay intact.
create or replace function invitly_private.invitation_payload(p_event_id uuid,p_function_ids text[]) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id',e.id,'title',e.title,'slug',e.slug,'description',e.description,'starts_at',e.starts_at,
    'venue',case when e.invitation_content is null then e.venue else coalesce(e.invitation_content->>'city','') end,'theme_id',e.theme_id,'music_enabled',e.music_enabled,'timezone',e.timezone,
    'invitation_content',case when e.invitation_content is null then null else jsonb_strip_nulls(jsonb_build_object(
      'slug',e.slug,'couple',e.invitation_content->'couple','initials',e.invitation_content->'initials',
      'intro',e.invitation_content->'intro','message',e.invitation_content->'message','families',e.invitation_content->'families',
      'occasion',coalesce(e.invitation_content->'occasion','"wedding"'::jsonb),
      'tradition',coalesce(e.invitation_content->'tradition','"neutral"'::jsonb),
      'traditionLabel',coalesce(e.invitation_content->'traditionLabel','""'::jsonb),
      'blessing',coalesce(e.invitation_content->'blessing','""'::jsonb),
      'coverText',e.invitation_content->'coverText','closingText',e.invitation_content->'closingText',
      'design',e.invitation_content->'design','coverPhotoId',coalesce(e.invitation_content->'coverPhotoId','""'::jsonb),
      -- These optional presentation fields contain no host-only data. Keep the
      -- explicit projection: unrelated future JSON keys must not become public.
      'personProfiles',e.invitation_content->'personProfiles','profileSection',e.invitation_content->'profileSection',
      'countdownAt',e.invitation_content->'countdownAt','video',e.invitation_content->'video',
      'city',e.invitation_content->'city','weddingAt',e.invitation_content->'weddingAt','timezone',e.timezone,
      'functions',coalesce((select jsonb_agg(jsonb_build_object(
        'id',f.value->'id','name',f.value->'name','description',f.value->'description','startsAt',f.value->'startsAt',
        'venue',f.value->'venue','address',f.value->'address','dressCode',f.value->'dressCode','icon',f.value->'icon','mapUrl',coalesce(f.value->'mapUrl','""'::jsonb),'visibility','public') order by f.ordinality)
        from jsonb_array_elements(case when jsonb_typeof(e.invitation_content->'functions')='array' then e.invitation_content->'functions' else '[]'::jsonb end) with ordinality f(value,ordinality)
        where coalesce(f.value->>'visibility','public') = 'public'
          and (p_function_ids is null or f.value->>'id'=any(p_function_ids))),'[]'::jsonb),'updates','[]'::jsonb)) end,
    'photos',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'alt_text',m.alt_text,'width',m.width,'height',m.height) order by m.created_at) from public.media m where m.event_id=e.id),'[]'::jsonb),
    'segments',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'starts_at',s.starts_at,'venue',s.venue,'maps_url',s.maps_url,'sort_order',s.sort_order) order by s.sort_order,s.starts_at)
      from public.event_segments s where s.event_id=e.id and (p_function_ids is null or s.id::text=any(p_function_ids))),'[]'::jsonb),
    'updates',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'message',u.message,'created_at',u.created_at,'updated_at',u.updated_at,'pinned',u.pinned) order by u.pinned desc,u.created_at desc)
      from public.event_updates u where u.event_id=e.id and u.is_published),'[]'::jsonb)
  ) from public.events e where e.id=p_event_id and e.is_published;
$$;
revoke all on function invitly_private.invitation_payload(uuid,text[]) from public,anon,authenticated;

commit;
