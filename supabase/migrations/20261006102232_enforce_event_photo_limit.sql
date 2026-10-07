BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '30s';

-- Keep existing rows and the counter backfill consistent while the trigger is installed.
LOCK TABLE public.media IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "invitly_private"."event_photo_counts" (
  "event_id"    uuid    NOT NULL,
  "photo_count" integer NOT NULL DEFAULT 0,
  CONSTRAINT "event_photo_counts_photo_count_check" CHECK ((photo_count >= 0)),
  CONSTRAINT "event_photo_counts_pkey" PRIMARY KEY (event_id)
);

ALTER TABLE "invitly_private"."event_photo_counts"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "invitly_private"."event_photo_counts" FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION invitly_private.enforce_event_photo_limit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  caller_id uuid := (select auth.uid());
  used integer;
begin
  if tg_op = 'UPDATE' and new.event_id = old.event_id then return new; end if;

  -- RLS checks the source row; also explicitly verify the new event before the
  -- private counter is touched. Service/admin maintenance has no end-user JWT.
  if tg_op <> 'DELETE' and caller_id is not null and not exists(
    select 1 from public.events where id = new.event_id and owner_id = caller_id
  ) then
    raise insufficient_privilege using message = 'You may only add photos to your own invitations.';
  end if;

  if tg_op = 'DELETE' then
    -- A parent-event cascade may already have removed its private counter.
    update invitly_private.event_photo_counts set photo_count = photo_count - 1
      where event_id = old.event_id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    insert into invitly_private.event_photo_counts(event_id,photo_count)
      values(new.event_id,0) on conflict(event_id) do nothing;
    -- Moves lock both counters in a consistent order, then release the old slot.
    perform 1 from invitly_private.event_photo_counts
      where event_id in (old.event_id,new.event_id) order by event_id for update;
    update invitly_private.event_photo_counts set photo_count = photo_count + 1
      where event_id = new.event_id and photo_count < 12 returning photo_count into used;
  else
    -- The row update serializes uploads, including direct Data API and bulk
    -- inserts. Its condition is rechecked after waiting for a concurrent writer.
    insert into invitly_private.event_photo_counts as counts(event_id,photo_count)
      values(new.event_id,1)
      on conflict(event_id) do update set photo_count = counts.photo_count + 1
        where counts.photo_count < 12
      returning photo_count into used;
  end if;

  if used is null then
    raise exception using errcode = 'P0001', message = 'EVENT_PHOTO_LIMIT_REACHED';
  end if;
  if tg_op = 'UPDATE' then
    update invitly_private.event_photo_counts set photo_count = photo_count - 1
      where event_id = old.event_id;
  end if;
  return new;
end;
$function$;

ALTER TABLE "invitly_private"."event_photo_counts"
  ADD CONSTRAINT "event_photo_counts_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Schema diffs do not include this data backfill. Preserve all existing photos,
-- including earlier overages; additions resume when the host removes enough.
INSERT INTO "invitly_private"."event_photo_counts" (event_id, photo_count)
SELECT event_id, count(*)::integer FROM public.media GROUP BY event_id;

CREATE TRIGGER enforce_event_photo_limit
  AFTER INSERT OR DELETE OR UPDATE OF event_id ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION invitly_private.enforce_event_photo_limit();

REVOKE ALL ON FUNCTION "invitly_private"."enforce_event_photo_limit"() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
