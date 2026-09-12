-- Add updated_at to prospecting_campaign_leads so Realtime fires on every
-- meaningful lead change (enrich, audit, score, AI, pipeline) and the
-- client can use the event as a precise invalidation signal.
begin;

alter table public.prospecting_campaign_leads
  add column if not exists updated_at timestamptz not null default now();

-- Back-fill existing rows so the column is consistent.
update public.prospecting_campaign_leads
  set updated_at = coalesce(scored_at, audited_at, enriched_at, created_at);

-- Auto-maintain updated_at on any future UPDATE to the row.
create or replace function public.prospecting_touch_lead_updated_at()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_prospecting_campaign_leads_updated_at
  on public.prospecting_campaign_leads;

create trigger trg_prospecting_campaign_leads_updated_at
  before update on public.prospecting_campaign_leads
  for each row execute function public.prospecting_touch_lead_updated_at();

-- Enable Supabase Realtime for this table (idempotent).
-- The publication supabase_realtime already exists in every Supabase project.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'prospecting_campaign_leads'
  ) then
    alter publication supabase_realtime add table public.prospecting_campaign_leads;
  end if;
end $$;

commit;

