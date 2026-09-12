-- Migration: Two-phase scoring (provisional -> final) and external audit failure handling.
begin;

-- 1. Add score_status, score_confidence, audit_failure_code, audit_failure_detail to prospecting_campaign_leads
alter table public.prospecting_campaign_leads
  add column if not exists score_status text not null default 'pending'
    check(score_status in ('pending','provisional','final')),
  add column if not exists score_confidence text not null default 'medium'
    check(score_confidence in ('low','medium','high')),
  add column if not exists audit_failure_code text,
  add column if not exists audit_failure_detail text;

-- Back-fill existing leads
update public.prospecting_campaign_leads
set score_status = case
  when current_score is not null and audited_at is not null then 'final'
  when current_score is not null and (digital->>'websiteKind' in ('none', 'social')) then 'final'
  when current_score is not null then 'provisional'
  else 'pending'
end,
score_confidence = case
  when current_score is not null and audited_at is not null then 'high'
  when current_score is not null and (digital->>'websiteKind' in ('none', 'social')) then 'high'
  when current_score is not null then 'medium'
  else 'low'
end;

-- 2. Add new scoring rules for external website failures (deterministic opportunity scoring)
insert into public.prospecting_scoring_rules(code,name,description,score_group,points,config,priority)
values
  ('WEBSITE_DNS_FAILURE','Domínio ou DNS inexistente','Domínio configurado não resolve no DNS (oportunidade de novo site)','site',25,'{"field": "dnsFailure", "op": "eq", "value": true}'::jsonb,13),
  ('WEBSITE_UNREACHABLE','Website inacessível / fora do ar','Servidor recusou conexão ou host inacessível (oportunidade de novo site/hospedagem)','site',20,'{"field": "unreachable", "op": "eq", "value": true}'::jsonb,14),
  ('WEBSITE_TLS_ERROR','Certificado SSL/TLS inválido','Website com certificado expirado ou erro de segurança SSL/TLS (oportunidade de correção/redesign)','site',15,'{"field": "tlsError", "op": "eq", "value": true}'::jsonb,15),
  ('WEBSITE_HTTP_ERROR','Website com erro HTTP 404/410','Página não encontrada ou removida definitivamente','site',15,'{"field": "httpError", "op": "eq", "value": true}'::jsonb,16)
on conflict do nothing;

-- 3. Update view prospecting_lead_list to include new columns
drop view if exists public.prospecting_lead_list cascade;
create view public.prospecting_lead_list with (security_invoker=true) as
  select
    cl.id, cl.campaign_id, cl.lead_id, cl.business, cl.digital,
    cl.qualification_status, cl.pipeline_stage, cl.current_score, cl.classification,
    cl.opportunity_type, cl.ai_analyzed, cl.manually_discarded, cl.last_contact_at,
    cl.enriched_at, cl.audited_at, cl.scored_at, cl.created_at, cl.updated_at,
    cl.score_status, cl.score_confidence, cl.audit_failure_code, cl.audit_failure_detail,
    l.name, l.google_place_id, c.segment,
    cl.business->>'city' as city, cl.business->>'state' as state,
    (cl.business->>'rating')::numeric as rating, (cl.business->>'reviews')::integer as reviews,
    cl.business->>'website' as website, cl.business->>'phone' as phone,
    cl.digital->>'email' as email, cl.digital->>'websiteKind' as website_kind,
    (cl.digital->>'performance')::numeric as performance,
    (cl.digital->>'badWebsite')::boolean as bad_website,
    (cl.digital->>'hasBooking')::boolean as has_booking,
    (cl.digital->>'whatsappOnly')::boolean as whatsapp_only
  from prospecting_campaign_leads cl
  join prospecting_leads l on l.id=cl.lead_id
  join prospecting_campaigns c on c.id=cl.campaign_id;

grant select on public.prospecting_lead_list to authenticated, service_role;

-- 4. Update prospecting_enqueue with default priorities
create or replace function public.prospecting_enqueue(
  p_campaign uuid,
  p_lead uuid,
  p_type text,
  p_key text,
  p_payload jsonb default '{}'::jsonb,
  p_priority integer default null
) returns void
language plpgsql security definer set search_path=public as $$
declare
  v_prio integer;
begin
  v_prio := coalesce(p_priority,
    case p_type
      when 'calculate_score' then 10
      when 'enrich_lead'     then 5
      when 'refresh_lead'    then 5
      when 'analyze_ai'      then 3
      when 'audit_website'   then 1
      when 'discover_places' then 0
      else 0
    end
  );

  insert into prospecting_jobs(campaign_id, campaign_lead_id, type, dedupe_key, payload, priority)
  values(p_campaign, p_lead, p_type, p_key, p_payload, v_prio)
  on conflict(dedupe_key) do nothing;
end $$;

-- 5. Update prospecting_claim_jobs with partition limits per job type and higher limit
create or replace function public.prospecting_claim_jobs(p_worker uuid, p_limit integer default 40)
returns setof prospecting_jobs
language plpgsql security definer set search_path=public as $$
begin
  -- Expired leases recovery
  with expired as (
    update prospecting_jobs set
      status = case when attempts >= max_attempts then 'failed' else 'pending' end,
      locked_by = null,
      locked_at = null,
      run_after = now() + interval '1 minute',
      error_message = 'Execução interrompida; lease expirado.'
    where status = 'processing' and locked_at < now() - interval '10 minutes'
      and pg_try_advisory_xact_lock(hashtextextended(campaign_id::text, 1701))
    returning *
  ), locked_leads as materialized (
    select cl.id, j.type from prospecting_campaign_leads cl
    join expired j on j.campaign_lead_id = cl.id
    where j.status = 'failed' and not cl.manually_discarded
    order by cl.id for update of cl
  )
  update prospecting_campaign_leads cl
  set qualification_status = case when l.type = 'audit_website' then cl.qualification_status else 'error' end
  from locked_leads l where l.id = cl.id;

  update prospecting_campaigns c set status = case
    when exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website') then 'error'
    else 'completed'
  end
  where c.status = 'running' and pg_try_advisory_xact_lock(hashtextextended(c.id::text, 1701))
    and (c.discovery_done or exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website'))
    and not exists(select 1 from prospecting_jobs where campaign_id = c.id and status in ('pending','processing'));

  -- Pick jobs with per-type concurrency bounds to avoid starvation & network flood
  return query with ranked as (
    select
      j.id,
      j.type,
      row_number() over (partition by j.type order by j.priority desc, j.created_at) as rank_in_type
    from prospecting_jobs j
    join prospecting_campaigns c on c.id = j.campaign_id
    where j.status = 'pending'
      and j.run_after <= now()
      and c.status = 'running'
      and pg_try_advisory_xact_lock(hashtextextended(c.id::text, 1701))
  ),
  picked as (
    select j.id
    from ranked r
    join prospecting_jobs j on j.id = r.id
    where (r.type = 'calculate_score' and r.rank_in_type <= 40)
       or (r.type in ('enrich_lead', 'refresh_lead') and r.rank_in_type <= 15)
       or (r.type = 'audit_website' and r.rank_in_type <= 8)
       or (r.type = 'analyze_ai' and r.rank_in_type <= 3)
       or (r.type = 'discover_places' and r.rank_in_type <= 3)
    order by j.priority desc, j.created_at
    for update of j skip locked
    limit greatest(1, least(p_limit, 50))
  ),
  claimed as (
    update prospecting_jobs j set
      status = 'processing',
      attempts = j.attempts + 1,
      started_at = now(),
      locked_at = now(),
      locked_by = p_worker
    from picked where j.id = picked.id
    returning j.*
  ),
  locked_leads as materialized (
    select cl.id, j.type from prospecting_campaign_leads cl
    join claimed j on j.campaign_lead_id = cl.id
    order by cl.id for update of cl
  ),
  stages as (
    update prospecting_campaign_leads cl set
      qualification_status = case
        when l.type in ('enrich_lead','refresh_lead') then 'enriching'
        when l.type = 'audit_website' then 'auditing'
        else cl.qualification_status
      end
    from locked_leads l
    where cl.id = l.id and not cl.manually_discarded
  )
  select * from claimed;
end $$;

-- 6. Update prospecting_complete_job for 2-phase scoring and classified audit failures
create or replace function public.prospecting_complete_job(p_id uuid, p_worker uuid, p_result jsonb)
returns void
language plpgsql security definer set search_path=public as $$
declare
  j prospecting_jobs;
  c prospecting_campaigns;
  cl prospecting_campaign_leads;
  v_lead uuid;
  v_cl uuid;
  v_run uuid;
  v_item jsonb;
  v_count int;
  v_business jsonb;
  v_digital jsonb;
  v_has_site boolean;
  v_phase text;
begin
  select * into j from prospecting_jobs where id = p_id;
  if j.id is null then return; end if;
  perform prospecting_lock_campaign(j.campaign_id);

  select * into j from prospecting_jobs where id = p_id and status = 'processing' and locked_by = p_worker for update;
  if j.id is null then return; end if;

  select * into strict c from prospecting_campaigns where id = j.campaign_id for update;
  if j.campaign_lead_id is not null then
    select * into strict cl from prospecting_campaign_leads where id = j.campaign_lead_id for update;
  end if;

  if cl.manually_discarded then
    update prospecting_jobs set status = 'cancelled', locked_by = null, locked_at = null where id = j.id;
    return;
  end if;

  -- ── discover_places ──────────────────────────────────────────────────────
  if j.type = 'discover_places' then
    select count(*) into v_count from prospecting_campaign_leads where campaign_id = c.id;
    for v_item in select value from jsonb_array_elements(p_result->'places') order by value->>'id' loop
      exit when v_count >= c.volume;
      insert into prospecting_leads(google_place_id, name)
      values(v_item->>'id', 'Estabelecimento em enriquecimento')
      on conflict(google_place_id) do update set google_place_id = excluded.google_place_id
      returning id into v_lead;

      v_cl := null;
      insert into prospecting_campaign_leads(campaign_id, lead_id)
      values(c.id, v_lead) on conflict do nothing returning id into v_cl;

      insert into prospecting_lead_sources(lead_id, campaign_id, external_id)
      values(v_lead, c.id, v_item->>'id') on conflict do nothing;

      if v_cl is not null then
        v_count := v_count + 1;
        perform prospecting_enqueue(c.id, v_cl, 'enrich_lead', v_cl || ':enrich', '{}'::jsonb, 5);
      end if;
    end loop;

    if v_count < c.volume and p_result->'next' is not null and p_result->'next' <> 'null'::jsonb then
      perform prospecting_enqueue(
        c.id, null, 'discover_places',
        c.id || ':discover:' || (p_result->'next'->>'term') || ':' || (p_result->'next'->>'page'),
        p_result->'next',
        0
      );
    else
      update prospecting_campaigns set
        discovery_done = true,
        discovery_note = case when v_count < c.volume
          then 'Busca concluída: resultados disponíveis abaixo do volume solicitado.'
          else 'Volume solicitado atingido.'
        end
      where id = c.id;
    end if;

  -- ── enrich_lead / refresh_lead ───────────────────────────────────────────
  elsif j.type in ('enrich_lead','refresh_lead') then
    v_business := p_result->'business';
    v_digital := p_result->'digital';

    update prospecting_leads set
      name = v_business->>'name',
      business = v_business,
      enriched_at = now()
    where id = cl.lead_id;

    update prospecting_campaign_leads set
      business = v_business,
      digital = v_digital,
      enriched_at = now(),
      audited_at = null,
      qualification_status = 'enriched',
      ai_analyzed = false,
      current_score = null,
      classification = null,
      scored_at = null,
      score_status = 'pending',
      audit_failure_code = null,
      audit_failure_detail = null
    where id = cl.id;

    delete from prospecting_signals where campaign_lead_id = cl.id;
    for v_item in select * from jsonb_array_elements(coalesce(p_result->'signals', '[]'::jsonb)) loop
      insert into prospecting_signals(lead_id, campaign_lead_id, code, evidence)
      values(cl.lead_id, cl.id, v_item->>'code', v_item);
    end loop;

    if nullif(v_business->>'phone', '') is not null then
      insert into prospecting_contacts(lead_id, channel, value, source)
      values(cl.lead_id, 'phone', v_business->>'phone', 'google_places')
      on conflict do nothing;
    end if;

    v_has_site := (v_digital->>'websiteKind' = 'website' and not coalesce((v_business->>'closed')::boolean, false));

    if v_has_site then
      -- 1. Enqueue PROVISIONAL score immediately (priority 10)
      perform prospecting_enqueue(
        c.id, cl.id, 'calculate_score',
        j.id || ':score:provisional',
        jsonb_build_object('scorePhase', 'provisional'),
        10
      );
      -- 2. Enqueue background website audit (priority 1)
      perform prospecting_enqueue(
        c.id, cl.id, 'audit_website',
        j.id || ':audit',
        '{}'::jsonb,
        1
      );
    else
      -- No audit needed: single FINAL score immediately (priority 10)
      perform prospecting_enqueue(
        c.id, cl.id, 'calculate_score',
        j.id || ':score:final',
        jsonb_build_object('scorePhase', 'final'),
        10
      );
    end if;

  -- ── audit_website ────────────────────────────────────────────────────────
  elsif j.type = 'audit_website' then
    insert into prospecting_audits(lead_id, campaign_lead_id, job_id, data)
    values(cl.lead_id, cl.id, j.id, p_result)
    on conflict(job_id) do nothing;

    if (p_result ? 'auditFailed') and (p_result->>'auditFailed')::boolean = true then
      -- External terminal failure (DNS, TLS, unreachable, 404, blocked)
      update prospecting_campaign_leads set
        digital = coalesce(p_result->'digital', digital),
        audited_at = now(),
        audit_failure_code = p_result->>'failureCode',
        audit_failure_detail = p_result->>'failureDetail',
        qualification_status = 'audited'
      where id = cl.id;

      -- Persist failure signals
      for v_item in select * from jsonb_array_elements(coalesce(p_result->'signals', '[]'::jsonb)) loop
        insert into prospecting_signals(lead_id, campaign_lead_id, code, evidence)
        values(cl.lead_id, cl.id, v_item->>'code', v_item)
        on conflict(campaign_lead_id, code) do update set evidence = excluded.evidence;
      end loop;
    else
      -- Successful audit
      update prospecting_campaign_leads set
        digital = p_result,
        audited_at = now(),
        audit_failure_code = null,
        audit_failure_detail = null,
        qualification_status = 'audited'
      where id = cl.id;

      if nullif(p_result->>'email', '') is not null then
        insert into prospecting_contacts(lead_id, channel, value, source)
        values(cl.lead_id, 'email', p_result->>'email', 'website')
        on conflict do nothing;
      end if;
    end if;

    -- Trigger FINAL score calculation
    perform prospecting_enqueue(
      c.id, cl.id, 'calculate_score',
      j.id || ':score:final',
      jsonb_build_object('scorePhase', 'final'),
      10
    );

  -- ── calculate_score ──────────────────────────────────────────────────────
  elsif j.type = 'calculate_score' then
    v_phase := coalesce(j.payload->>'scorePhase', 'final');

    delete from prospecting_signals where campaign_lead_id = cl.id and evidence ? 'group';
    insert into prospecting_score_runs(campaign_lead_id, job_id, scoring_version, result, input, rules_snapshot)
    values(cl.id, j.id, p_result->'score'->>'version', p_result->'score', p_result->'input', p_result->'rules')
    returning id into v_run;

    for v_item in select * from jsonb_array_elements(p_result->'score'->'items') loop
      insert into prospecting_score_items(score_run_id, code, score_group, points, explanation)
      values(v_run, v_item->>'code', v_item->>'group', (v_item->>'points')::numeric, v_item->>'explanation');

      insert into prospecting_signals(lead_id, campaign_lead_id, code, evidence)
      values(cl.lead_id, cl.id, v_item->>'code', v_item)
      on conflict(campaign_lead_id, code) do update set evidence = excluded.evidence;
    end loop;

    update prospecting_campaign_leads set
      current_score = (p_result->'score'->>'final')::int,
      classification = p_result->'score'->>'classification',
      qualification_status = p_result->'score'->>'qualificationStatus',
      opportunity_type = p_result->'score'->>'opportunityType',
      score_status = v_phase,
      score_confidence = case when v_phase = 'final' then 'high' else 'medium' end,
      scored_at = now(),
      ai_analyzed = case when v_phase = 'provisional' then false else ai_analyzed end
    where id = cl.id;

    -- Only enqueue Gemini AI analysis on FINAL score
    if (p_result->'score'->>'useAI')::boolean and v_phase = 'final' then
      perform prospecting_enqueue(
        c.id, cl.id, 'analyze_ai',
        v_run || ':ai',
        jsonb_build_object('scoreRunId', v_run),
        3
      );
    end if;

  -- ── analyze_ai ───────────────────────────────────────────────────────────
  elsif j.type = 'analyze_ai' then
    insert into prospecting_ai_analyses(score_run_id, campaign_lead_id, model, analysis)
    values((j.payload->>'scoreRunId')::uuid, cl.id, p_result->>'model', p_result->'analysis')
    on conflict(score_run_id) do nothing;

    update prospecting_campaign_leads set ai_analyzed = true where id = cl.id;
  end if;

  -- Mark job as completed
  update prospecting_jobs set
    status = 'completed',
    completed_at = now(),
    locked_at = null,
    locked_by = null,
    error_message = null
  where id = j.id;

  -- Check campaign completion
  if ((select discovery_done from prospecting_campaigns where id = c.id) or exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website'))
    and not exists(select 1 from prospecting_jobs where campaign_id = c.id and status in ('pending','processing')) then
    update prospecting_campaigns set status = case
      when exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website') then 'error'
      else 'completed'
    end where id = c.id and status = 'running';
  end if;
end $$;

-- 7. Update prospecting_fail_job
create or replace function public.prospecting_fail_job(p_id uuid, p_worker uuid, p_error text)
returns void
language plpgsql security definer set search_path=public as $$
declare
  j prospecting_jobs;
begin
  select * into j from prospecting_jobs where id = p_id;
  if j.id is null then return; end if;
  perform prospecting_lock_campaign(j.campaign_id);

  update prospecting_jobs set
    status = case when attempts >= max_attempts then 'failed' else 'pending' end,
    run_after = now() + case when attempts = 1 then interval '1 minute' else interval '5 minutes' end,
    error_message = left(p_error, 600),
    locked_by = null,
    locked_at = null
  where id = p_id and status = 'processing' and locked_by = p_worker
  returning * into j;

  if j.status = 'failed' then
    if j.type = 'audit_website' then
      -- External audit retries exhausted (timeouts, 5xx).
      -- Preserve the lead, record unreachable status, and calculate final score with partial data!
      update prospecting_campaign_leads set
        audit_failure_code = 'AUDIT_UNREACHABLE',
        audit_failure_detail = left(p_error, 200),
        audited_at = now(),
        qualification_status = case when qualification_status = 'auditing' then 'audited' else qualification_status end
      where id = j.campaign_lead_id and not manually_discarded;

      insert into prospecting_signals(lead_id, campaign_lead_id, code, evidence)
      values (
        (select lead_id from prospecting_campaign_leads where id = j.campaign_lead_id),
        j.campaign_lead_id,
        'WEBSITE_UNREACHABLE',
        jsonb_build_object('detail', left(p_error, 200), 'exhausted', true)
      ) on conflict(campaign_lead_id, code) do update set evidence = excluded.evidence;

      perform prospecting_enqueue(
        j.campaign_id,
        j.campaign_lead_id,
        'calculate_score',
        j.id || ':score:final',
        jsonb_build_object('scorePhase', 'final'),
        10
      );
    else
      -- Real internal pipeline error (unexpected bug, schema error, etc.)
      update prospecting_campaign_leads set qualification_status = 'error'
      where id = j.campaign_lead_id and not manually_discarded;
    end if;

    -- Only mark campaign error if real internal job failed
    if not exists(select 1 from prospecting_jobs where campaign_id = j.campaign_id and status in ('pending','processing')) then
      update prospecting_campaigns set status = case
        when exists(select 1 from prospecting_jobs where campaign_id = j.campaign_id and status = 'failed' and type <> 'audit_website') then 'error'
        else 'completed'
      end where id = j.campaign_id and status = 'running';
    end if;
  end if;
end $$;

commit;
