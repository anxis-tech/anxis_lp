-- Migration: Pipeline v3 - Lease heartbeat, shorter recovery window, place displayName, and robust website kinds
begin;

-- 1. Create heartbeat function for workers processing active jobs
create or replace function public.prospecting_heartbeat(p_worker uuid, p_job_ids uuid[])
returns void
language plpgsql security definer set search_path=public as $$
begin
  update public.prospecting_jobs
  set locked_at = now()
  where id = any(p_job_ids)
    and locked_by = p_worker
    and status = 'processing';
end $$;

grant execute on function public.prospecting_heartbeat(uuid, uuid[]) to authenticated, service_role;

-- 2. Update prospecting_claim_jobs with 3-minute recovery window and bounded audit concurrency
create or replace function public.prospecting_claim_jobs(p_worker uuid, p_limit integer default 40)
returns setof prospecting_jobs
language plpgsql security definer set search_path=public as $$
begin
  -- Expired leases recovery: 3 minutes without heartbeat means the container/worker died
  with expired as (
    update prospecting_jobs set
      status = case when attempts >= max_attempts then 'failed' else 'pending' end,
      locked_by = null,
      locked_at = null,
      run_after = now() + interval '1 minute',
      error_message = 'Execução interrompida; lease expirado.'
    where status = 'processing' and locked_at < now() - interval '3 minutes'
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

  -- Pick jobs with per-type concurrency bounds:
  -- calculate_score: up to 40 (lightning fast)
  -- enrich_lead / refresh_lead: up to 15
  -- audit_website: up to 3 (strictly bounded to avoid socket/bandwidth saturation)
  -- analyze_ai: up to 3
  -- discover_places: up to 3
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
       or (r.type = 'audit_website' and r.rank_in_type <= 3)
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

-- 3. Update prospecting_complete_job for discover_places to capture real displayName
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
  v_display_name text;
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

      v_display_name := coalesce(v_item->'displayName'->>'text', 'Carregando empresa...');

      insert into prospecting_leads(google_place_id, name)
      values(v_item->>'id', v_display_name)
      on conflict(google_place_id) do update set
        name = case
          when prospecting_leads.name in ('Estabelecimento em enriquecimento', 'Carregando empresa...')
            then coalesce(excluded.name, prospecting_leads.name)
          else prospecting_leads.name
        end
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
      name = coalesce(v_business->>'name', name),
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

    -- Only real 'website' kinds undergo technical crawler audit.
    -- messaging_only, social_only, link_aggregator, shortener_unresolved, none skip audit!
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
      -- Non-website (social, messaging, aggregator, none): single FINAL score immediately (priority 10)
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
      update prospecting_campaign_leads set
        digital = coalesce(p_result->'digital', digital),
        audited_at = now(),
        audit_failure_code = p_result->>'failureCode',
        audit_failure_detail = p_result->>'failureDetail',
        qualification_status = 'audited'
      where id = cl.id;

      for v_item in select * from jsonb_array_elements(coalesce(p_result->'signals', '[]'::jsonb)) loop
        insert into prospecting_signals(lead_id, campaign_lead_id, code, evidence)
        values(cl.lead_id, cl.id, v_item->>'code', v_item)
        on conflict(campaign_lead_id, code) do update set evidence = excluded.evidence;
      end loop;
    else
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

  update prospecting_jobs set
    status = 'completed',
    completed_at = now(),
    locked_at = null,
    locked_by = null,
    error_message = null
  where id = j.id;

  if ((select discovery_done from prospecting_campaigns where id = c.id) or exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website'))
    and not exists(select 1 from prospecting_jobs where campaign_id = c.id and status in ('pending','processing')) then
    update prospecting_campaigns set status = case
      when exists(select 1 from prospecting_jobs where campaign_id = c.id and status = 'failed' and type <> 'audit_website') then 'error'
      else 'completed'
    end where id = c.id and status = 'running';
  end if;
end $$;

-- 4. Clean up legacy placeholder strings in prospecting_leads
update public.prospecting_leads
set name = 'Carregando empresa...'
where name = 'Estabelecimento em enriquecimento';

commit;
