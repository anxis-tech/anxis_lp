-- Prospecção: isolated tables, existing profiles/individual permissions, no outreach sends.
begin;
create function public.prospecting_allowed(p_permission text default 'prospecting.view') returns boolean
language sql stable security definer set search_path = public as $$
 select exists(select 1 from profiles where user_id=auth.uid() and is_active=true
 and (is_super_admin=true or custom_permissions->p_permission='true'::jsonb));
$$;
revoke all on function public.prospecting_allowed(text) from public, anon;
grant execute on function public.prospecting_allowed(text) to authenticated, service_role;

create table public.prospecting_campaigns (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id),
 segment text not null, city text not null, state text not null, country text not null default 'BR',
 location_config jsonb not null default '{}', search_terms jsonb not null,
 volume integer not null check(volume in (100,250,500,1000)),
 min_score integer not null default 55 check(min_score between 0 and 100),
 ai_score_threshold integer not null default 85 check(ai_score_threshold between 0 and 100),
 status text not null default 'running' check(status in ('running','paused','completed','error')),
 discovery_done boolean not null default false, discovery_note text,
 created_at timestamptz not null default now()
);
create table public.prospecting_leads (
 id uuid primary key default gen_random_uuid(), google_place_id text unique,
 name text not null, business jsonb not null default '{}', enriched_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.prospecting_campaign_leads (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references prospecting_campaigns on delete cascade,
 lead_id uuid not null references prospecting_leads, business jsonb not null default '{}', digital jsonb not null default '{}',
 qualification_status text not null default 'discovered' check(qualification_status in
 ('discovered','enriching','enriched','auditing','audited','opportunity','qualified','highly_qualified','discarded','error')),
 pipeline_stage text not null default 'new' check(pipeline_stage in ('new','reviewed','contacted','replied','meeting','proposal','won','lost')),
 current_score integer check(current_score between 0 and 100), classification text,
 opportunity_type text, ai_analyzed boolean not null default false, manually_discarded boolean not null default false,
 last_contact_at timestamptz, enriched_at timestamptz, audited_at timestamptz, scored_at timestamptz,
 created_at timestamptz not null default now(), unique(campaign_id,lead_id)
);
create table public.prospecting_lead_sources (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references prospecting_leads,
 campaign_id uuid not null references prospecting_campaigns on delete cascade, provider text not null default 'google_places',
 external_id text not null, discovered_at timestamptz not null default now(), unique(campaign_id,lead_id,provider)
);
create table public.prospecting_jobs (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references prospecting_campaigns on delete cascade,
 campaign_lead_id uuid references prospecting_campaign_leads on delete cascade,
 type text not null check(type in ('discover_places','enrich_lead','audit_website','calculate_score','analyze_ai','refresh_lead')),
 status text not null default 'pending' check(status in ('pending','processing','completed','failed','cancelled')),
 priority integer not null default 0, attempts integer not null default 0, max_attempts integer not null default 3,
 run_after timestamptz not null default now(), started_at timestamptz, completed_at timestamptz,
 error_message text, payload jsonb not null default '{}', locked_at timestamptz, locked_by uuid,
 dedupe_key text not null unique, created_at timestamptz not null default now()
);
create table public.prospecting_audits (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references prospecting_leads,
 campaign_lead_id uuid not null references prospecting_campaign_leads on delete cascade,
 job_id uuid not null unique references prospecting_jobs, data jsonb not null, created_at timestamptz not null default now()
);
create table public.prospecting_signals (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references prospecting_leads,
 campaign_lead_id uuid not null references prospecting_campaign_leads on delete cascade,
 code text not null, evidence jsonb not null default '{}', unique(campaign_lead_id,code)
);
create table public.prospecting_scoring_rules (
 id uuid primary key default gen_random_uuid(), code text not null, name text not null, description text not null,
 score_group text not null check(score_group in ('business','site','system','commercial','penalties')),
 points numeric not null, config jsonb not null default '{}', enabled boolean not null default true,
 priority integer not null default 0, campaign_id uuid references prospecting_campaigns on delete cascade,
 unique nulls not distinct(code,campaign_id)
);
create table public.prospecting_score_runs (
 id uuid primary key default gen_random_uuid(), campaign_lead_id uuid not null references prospecting_campaign_leads on delete cascade,
 job_id uuid not null unique references prospecting_jobs, scoring_version text not null,
 result jsonb not null, input jsonb not null, rules_snapshot jsonb not null, created_at timestamptz not null default now()
);
create table public.prospecting_score_items (
 id uuid primary key default gen_random_uuid(), score_run_id uuid not null references prospecting_score_runs on delete cascade,
 code text not null, score_group text not null, points numeric not null, explanation text not null, unique(score_run_id,code)
);
create table public.prospecting_ai_analyses (
 id uuid primary key default gen_random_uuid(), score_run_id uuid not null unique references prospecting_score_runs on delete cascade,
 campaign_lead_id uuid not null references prospecting_campaign_leads on delete cascade,
 model text not null, analysis jsonb not null, created_at timestamptz not null default now()
);
create table public.prospecting_pipeline_events (
 id uuid primary key default gen_random_uuid(), campaign_lead_id uuid not null references prospecting_campaign_leads on delete cascade,
 from_stage text not null, to_stage text not null, created_by uuid references auth.users, created_at timestamptz not null default now()
);
create table public.prospecting_contacts (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references prospecting_leads,
 channel text not null check(channel in ('whatsapp','email','phone')), value text not null,
 consent_status text not null default 'unknown' check(consent_status in ('unknown','granted','revoked')),
 source text not null, created_at timestamptz not null default now(), unique(lead_id,channel,value)
);
create table public.prospecting_outreach_campaigns (
 id uuid primary key default gen_random_uuid(), name text not null, created_by uuid not null references auth.users,
 channel text not null check(channel in ('whatsapp','email')), status text not null default 'draft' check(status='draft'),
 template jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.prospecting_outreach_recipients (
 id uuid primary key default gen_random_uuid(), outreach_campaign_id uuid not null references prospecting_outreach_campaigns on delete cascade,
 contact_id uuid not null references prospecting_contacts, status text not null default 'pending',
 unique(outreach_campaign_id,contact_id)
);
create table public.prospecting_messages (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references prospecting_outreach_recipients,
 provider_id text unique, status text not null default 'draft' check(status in
 ('draft','queued','sent','delivered','read','opened','replied','bounced','failed')),
 payload jsonb not null default '{}', created_at timestamptz not null default now()
);
create index on prospecting_campaign_leads(campaign_id,current_score desc);
create index on prospecting_campaign_leads(campaign_id,qualification_status);
create index on prospecting_campaign_leads(campaign_id,pipeline_stage);
create index on prospecting_campaign_leads(campaign_id,created_at desc);
create index on prospecting_campaign_leads((business->>'city'),(business->>'state'));
create index on prospecting_campaign_leads(((business->>'reviews')::integer) desc);
create index on prospecting_campaign_leads(((business->>'rating')::numeric) desc);
create index on prospecting_campaign_leads(((digital->>'performance')::numeric));
create index on prospecting_jobs(status,run_after,priority desc);
create index on prospecting_jobs(campaign_id,campaign_lead_id);
create index on prospecting_signals(lead_id,code);
create index on prospecting_score_runs(campaign_lead_id,created_at desc);

-- All module members share this internal prospecting workspace; no role/email shortcuts.
do $$ declare t text; begin
 foreach t in array array['campaigns','leads','campaign_leads','lead_sources','audits','signals','scoring_rules',
 'score_runs','score_items','ai_analyses','pipeline_events','jobs','contacts','outreach_campaigns','outreach_recipients','messages'] loop
 execute format('alter table public.prospecting_%I enable row level security',t);
 execute format('revoke all on public.prospecting_%I from anon, authenticated',t);
 execute format('grant select on public.prospecting_%I to authenticated',t);
 execute format('grant all on public.prospecting_%I to service_role',t);
 execute format('create policy module_read on public.prospecting_%I for select to authenticated using (public.prospecting_allowed())',t);
 end loop;
end $$;

create view public.prospecting_lead_list with (security_invoker=true) as
 select cl.*, l.name, l.google_place_id, c.segment,
 cl.business->>'city' as city, cl.business->>'state' as state,
 (cl.business->>'rating')::numeric as rating, (cl.business->>'reviews')::integer as reviews,
 cl.business->>'website' as website, cl.business->>'phone' as phone,
 cl.digital->>'email' as email, cl.digital->>'websiteKind' as website_kind,
 (cl.digital->>'performance')::numeric as performance,
 (cl.digital->>'badWebsite')::boolean as bad_website,
 (cl.digital->>'hasBooking')::boolean as has_booking,
 (cl.digital->>'whatsappOnly')::boolean as whatsapp_only
 from prospecting_campaign_leads cl join prospecting_leads l on l.id=cl.lead_id
 join prospecting_campaigns c on c.id=cl.campaign_id;
grant select on prospecting_lead_list to authenticated,service_role;

-- Serialize mutations within a campaign before any row locks. Claim/recovery use the nonblocking
-- variant so a busy campaign cannot stall other campaigns. HTTP work runs outside transactions.
create function public.prospecting_lock_campaign(p_id uuid) returns void
language sql security definer set search_path=public as $$
 select pg_advisory_xact_lock(hashtextextended(p_id::text,1701));
$$;

create function public.prospecting_create_campaign(p_data jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not prospecting_allowed() or not prospecting_allowed('prospecting.manage') then raise exception 'Sem permissão'; end if;
 if length(trim(p_data->>'city')) not between 2 and 100 or (p_data->>'state') !~ '^[A-Z]{2}$'
 or length(p_data->>'segment') not between 2 and 100 or jsonb_array_length(p_data->'search_terms') not between 1 and 12
 then raise exception 'Campanha inválida'; end if;
 insert into prospecting_campaigns(created_by,segment,city,state,volume,min_score,ai_score_threshold,search_terms)
 values(auth.uid(),p_data->>'segment',p_data->>'city',p_data->>'state',(p_data->>'volume')::int,
 (p_data->>'min_score')::int,(p_data->>'ai_score_threshold')::int,p_data->'search_terms') returning id into v_id;
 insert into prospecting_jobs(campaign_id,type,dedupe_key) values(v_id,'discover_places',v_id||':discover:0:0');
 return v_id;
end $$;
create function public.prospecting_campaign_control(p_id uuid,p_status text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not prospecting_allowed() or not prospecting_allowed('prospecting.manage') then raise exception 'Sem permissão'; end if;
 perform prospecting_lock_campaign(p_id);
 if p_status not in ('running','paused') then raise exception 'Status inválido'; end if;
 update prospecting_campaigns c set status=case
 when p_status='running' and c.discovery_done and not exists(select 1 from prospecting_jobs where campaign_id=c.id and status in ('pending','processing'))
 then case when exists(select 1 from prospecting_jobs where campaign_id=c.id and status='failed') then 'error' else 'completed' end
 else p_status end where id=p_id;
end $$;
create function public.prospecting_change_stage(p_ids uuid[],p_stage text) returns void
language plpgsql security definer set search_path=public as $$
declare r record; v_campaign uuid;
begin
 if not prospecting_allowed() or not prospecting_allowed('prospecting.manage') then raise exception 'Sem permissão'; end if;
 if cardinality(p_ids) not between 1 and 100 or p_stage not in ('new','reviewed','contacted','replied','meeting','proposal','won','lost') then raise exception 'Status inválido'; end if;
 for v_campaign in select distinct campaign_id from prospecting_campaign_leads where id=any(p_ids) order by campaign_id loop
 perform prospecting_lock_campaign(v_campaign);
 end loop;
 for r in select * from prospecting_campaign_leads where id=any(p_ids) order by id for update loop
 if r.pipeline_stage<>p_stage then
 insert into prospecting_pipeline_events(campaign_lead_id,from_stage,to_stage,created_by) values(r.id,r.pipeline_stage,p_stage,auth.uid());
 update prospecting_campaign_leads set pipeline_stage=p_stage,
 last_contact_at=case when p_stage='contacted' then now() else last_contact_at end where id=r.id;
 end if;
 end loop;
end $$;
create function public.prospecting_lead_control(p_id uuid,p_action text) returns void
language plpgsql security definer set search_path=public as $$
declare r prospecting_campaign_leads; j prospecting_jobs;
begin
 if not prospecting_allowed() or not prospecting_allowed('prospecting.manage') then raise exception 'Sem permissão'; end if;
 select * into strict r from prospecting_campaign_leads where id=p_id;
 perform prospecting_lock_campaign(r.campaign_id);
 perform id from prospecting_campaigns where id=r.campaign_id for update;
 select * into strict r from prospecting_campaign_leads where id=p_id for update;
 if p_action='discard' then
 update prospecting_campaign_leads set manually_discarded=true,qualification_status='discarded' where id=p_id;
 update prospecting_jobs set status='cancelled',locked_by=null,locked_at=null where campaign_lead_id=p_id and status in ('pending','processing');
 elsif p_action in ('restore','recalculate','refresh','retry') then
 if exists(select 1 from prospecting_jobs where campaign_lead_id=p_id and status in ('pending','processing')) then return; end if;
 update prospecting_campaign_leads set manually_discarded=false where id=p_id;
 if p_action='retry' then
 select * into j from prospecting_jobs where campaign_lead_id=p_id and status='failed' order by created_at desc limit 1;
 if j.id is not null then
 update prospecting_jobs set status='pending',attempts=0,run_after=now(),locked_by=null,locked_at=null,error_message=null where id=j.id;
 else raise exception 'Nenhuma etapa com falha para repetir'; end if;
 else
 update prospecting_jobs set status='cancelled' where campaign_lead_id=p_id and status='failed';
 insert into prospecting_jobs(campaign_id,campaign_lead_id,type,dedupe_key)
 values(r.campaign_id,p_id,case when p_action='refresh' or r.enriched_at is null then 'refresh_lead' else 'calculate_score' end,gen_random_uuid()::text);
 end if;
 update prospecting_campaigns set status='running' where id=r.campaign_id and status in ('completed','error');
 else raise exception 'Ação inválida'; end if;
end $$;

create function public.prospecting_retry_discovery(p_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not prospecting_allowed() or not prospecting_allowed('prospecting.manage') then raise exception 'Sem permissão'; end if;
 perform prospecting_lock_campaign(p_id);
 update prospecting_jobs set status='pending',attempts=0,run_after=now(),error_message=null
 where campaign_id=p_id and type='discover_places' and status='failed';
 update prospecting_campaigns set status='running' where id=p_id;
end $$;

create function public.prospecting_claim_jobs(p_worker uuid,p_limit integer default 5) returns setof prospecting_jobs
language plpgsql security definer set search_path=public as $$
begin
 -- Expired leases recover crashed executions. Finalization is fenced by locked_by.
 with expired as (
 update prospecting_jobs set status=case when attempts>=max_attempts then 'failed' else 'pending' end,
 locked_by=null,locked_at=null,run_after=now()+interval '1 minute',error_message='Execução interrompida; lease expirado.'
 where status='processing' and locked_at<now()-interval '10 minutes'
 and pg_try_advisory_xact_lock(hashtextextended(campaign_id::text,1701)) returning *
 ), locked_leads as materialized (
 select cl.id from prospecting_campaign_leads cl join expired j on j.campaign_lead_id=cl.id
 where j.status='failed' and not cl.manually_discarded order by cl.id for update of cl
 ) update prospecting_campaign_leads cl set qualification_status='error' from locked_leads l where l.id=cl.id;
 update prospecting_campaigns c set status=case when exists(select 1 from prospecting_jobs where campaign_id=c.id and status='failed') then 'error' else 'completed' end
 where c.status='running' and pg_try_advisory_xact_lock(hashtextextended(c.id::text,1701))
 and (c.discovery_done or exists(select 1 from prospecting_jobs where campaign_id=c.id and status='failed'))
 and not exists(select 1 from prospecting_jobs where campaign_id=c.id and status in ('pending','processing'));
 return query with picked as (
 select j.id from prospecting_jobs j join prospecting_campaigns c on c.id=j.campaign_id
 where j.status='pending' and j.run_after<=now() and c.status='running'
 and pg_try_advisory_xact_lock(hashtextextended(c.id::text,1701))
 order by j.priority desc,j.created_at for update of j skip locked limit greatest(1,least(p_limit,10))
 ), claimed as (
 update prospecting_jobs j set status='processing',attempts=j.attempts+1,
 started_at=now(),locked_at=now(),locked_by=p_worker from picked where j.id=picked.id returning j.*
 ), locked_leads as materialized (
 select cl.id from prospecting_campaign_leads cl join claimed j on j.campaign_lead_id=cl.id
 order by cl.id for update of cl
 ), stages as (
 update prospecting_campaign_leads cl set qualification_status=case when j.type in ('enrich_lead','refresh_lead') then 'enriching'
 when j.type='audit_website' then 'auditing' else cl.qualification_status end
 from claimed j join locked_leads l on l.id=j.campaign_lead_id where cl.id=l.id and not cl.manually_discarded
 ) select * from claimed;
end $$;
create function public.prospecting_fail_job(p_id uuid,p_worker uuid,p_error text) returns void
language plpgsql security definer set search_path=public as $$
declare j prospecting_jobs;
begin
 select * into j from prospecting_jobs where id=p_id;
 if j.id is null then return; end if;
 perform prospecting_lock_campaign(j.campaign_id);
 update prospecting_jobs set status=case when attempts>=max_attempts then 'failed' else 'pending' end,
 run_after=now()+case when attempts=1 then interval '1 minute' else interval '5 minutes' end,
 error_message=left(p_error,600),locked_by=null,locked_at=null
 where id=p_id and status='processing' and locked_by=p_worker returning * into j;
 if j.status='failed' then
 update prospecting_campaign_leads set qualification_status='error' where id=j.campaign_lead_id and not manually_discarded;
 if not exists(select 1 from prospecting_jobs where campaign_id=j.campaign_id and status in ('pending','processing')) then
 update prospecting_campaigns set status='error' where id=j.campaign_id and status='running'; end if;
 end if;
end $$;

create function public.prospecting_enqueue(p_campaign uuid,p_lead uuid,p_type text,p_key text,p_payload jsonb default '{}') returns void
language sql security definer set search_path=public as $$
 insert into prospecting_jobs(campaign_id,campaign_lead_id,type,dedupe_key,payload)
 values(p_campaign,p_lead,p_type,p_key,p_payload) on conflict(dedupe_key) do nothing;
$$;

-- All effects and children commit together. A retry never duplicates a score, AI record or child.
create function public.prospecting_complete_job(p_id uuid,p_worker uuid,p_result jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare j prospecting_jobs; c prospecting_campaigns; cl prospecting_campaign_leads;
 v_lead uuid; v_cl uuid; v_run uuid; v_item jsonb; v_count int; v_business jsonb; v_digital jsonb;
begin
 select * into j from prospecting_jobs where id=p_id;
 if j.id is null then return; end if;
 perform prospecting_lock_campaign(j.campaign_id);
 select * into j from prospecting_jobs where id=p_id and status='processing' and locked_by=p_worker for update;
 if j.id is null then return; end if;
 select * into strict c from prospecting_campaigns where id=j.campaign_id for update;
 if j.campaign_lead_id is not null then select * into strict cl from prospecting_campaign_leads where id=j.campaign_lead_id for update; end if;
 if cl.manually_discarded then
 update prospecting_jobs set status='cancelled',locked_by=null,locked_at=null where id=j.id; return;
 end if;
 if j.type='discover_places' then
 select count(*) into v_count from prospecting_campaign_leads where campaign_id=c.id;
 for v_item in select value from jsonb_array_elements(p_result->'places') order by value->>'id' loop
 exit when v_count>=c.volume;
 insert into prospecting_leads(google_place_id,name) values(v_item->>'id','Estabelecimento em enriquecimento')
 on conflict(google_place_id) do update set google_place_id=excluded.google_place_id returning id into v_lead;
 v_cl:=null;
 insert into prospecting_campaign_leads(campaign_id,lead_id) values(c.id,v_lead) on conflict do nothing returning id into v_cl;
 insert into prospecting_lead_sources(lead_id,campaign_id,external_id) values(v_lead,c.id,v_item->>'id') on conflict do nothing;
 if v_cl is not null then
 v_count:=v_count+1;
 perform prospecting_enqueue(c.id,v_cl,'enrich_lead',v_cl||':enrich');
 end if;
 end loop;
 if v_count<c.volume and p_result->'next' is not null and p_result->'next'<>'null'::jsonb then
 perform prospecting_enqueue(c.id,null,'discover_places',c.id||':discover:'||(p_result->'next'->>'term')||':'||(p_result->'next'->>'page'),p_result->'next');
 else
 update prospecting_campaigns set discovery_done=true,discovery_note=case when v_count<c.volume
 then 'Busca concluída: resultados disponíveis abaixo do volume solicitado.' else 'Volume solicitado atingido.' end where id=c.id;
 end if;
 elsif j.type in ('enrich_lead','refresh_lead') then
 v_business:=p_result->'business'; v_digital:=p_result->'digital';
 update prospecting_leads set name=v_business->>'name',business=v_business,enriched_at=now() where id=cl.lead_id;
 update prospecting_campaign_leads set business=v_business,digital=v_digital,enriched_at=now(),audited_at=null,
 qualification_status='enriched',ai_analyzed=false,current_score=null,classification=null,scored_at=null where id=cl.id;
 delete from prospecting_signals where campaign_lead_id=cl.id;
 for v_item in select * from jsonb_array_elements(coalesce(p_result->'signals','[]')) loop
 insert into prospecting_signals(lead_id,campaign_lead_id,code,evidence) values(cl.lead_id,cl.id,v_item->>'code',v_item);
 end loop;
 if nullif(v_business->>'phone','') is not null then
 insert into prospecting_contacts(lead_id,channel,value,source) values(cl.lead_id,'phone',v_business->>'phone','google_places') on conflict do nothing;
 end if;
 perform prospecting_enqueue(c.id,cl.id,case when v_digital->>'websiteKind'='website' and not coalesce((v_business->>'closed')::boolean,false)
 then 'audit_website' else 'calculate_score' end,j.id||':next');
 elsif j.type='audit_website' then
 insert into prospecting_audits(lead_id,campaign_lead_id,job_id,data) values(cl.lead_id,cl.id,j.id,p_result) on conflict(job_id) do nothing;
 update prospecting_campaign_leads set digital=p_result,audited_at=now(),qualification_status='audited' where id=cl.id;
 if nullif(p_result->>'email','') is not null then
 insert into prospecting_contacts(lead_id,channel,value,source) values(cl.lead_id,'email',p_result->>'email','website') on conflict do nothing;
 end if;
 perform prospecting_enqueue(c.id,cl.id,'calculate_score',j.id||':score');
 elsif j.type='calculate_score' then
 delete from prospecting_signals where campaign_lead_id=cl.id and evidence ? 'group';
 insert into prospecting_score_runs(campaign_lead_id,job_id,scoring_version,result,input,rules_snapshot)
 values(cl.id,j.id,p_result->'score'->>'version',p_result->'score',p_result->'input',p_result->'rules') returning id into v_run;
 for v_item in select * from jsonb_array_elements(p_result->'score'->'items') loop
 insert into prospecting_score_items(score_run_id,code,score_group,points,explanation)
 values(v_run,v_item->>'code',v_item->>'group',(v_item->>'points')::numeric,v_item->>'explanation');
 insert into prospecting_signals(lead_id,campaign_lead_id,code,evidence) values(cl.lead_id,cl.id,v_item->>'code',v_item)
 on conflict(campaign_lead_id,code) do update set evidence=excluded.evidence;
 end loop;
 update prospecting_campaign_leads set current_score=(p_result->'score'->>'final')::int,
 classification=p_result->'score'->>'classification',qualification_status=p_result->'score'->>'qualificationStatus',
 opportunity_type=p_result->'score'->>'opportunityType',scored_at=now(),ai_analyzed=false where id=cl.id;
 if (p_result->'score'->>'useAI')::boolean then
 perform prospecting_enqueue(c.id,cl.id,'analyze_ai',v_run||':ai',jsonb_build_object('scoreRunId',v_run));
 end if;
 elsif j.type='analyze_ai' then
 insert into prospecting_ai_analyses(score_run_id,campaign_lead_id,model,analysis)
 values((j.payload->>'scoreRunId')::uuid,cl.id,p_result->>'model',p_result->'analysis') on conflict(score_run_id) do nothing;
 update prospecting_campaign_leads set ai_analyzed=true where id=cl.id;
 end if;
 update prospecting_jobs set status='completed',completed_at=now(),locked_at=null,locked_by=null,error_message=null where id=j.id;
 if ((select discovery_done from prospecting_campaigns where id=c.id) or exists(select 1 from prospecting_jobs where campaign_id=c.id and status='failed'))
 and not exists(select 1 from prospecting_jobs where campaign_id=c.id and status in ('pending','processing')) then
 update prospecting_campaigns set status=case when exists(select 1 from prospecting_jobs where campaign_id=c.id and status='failed')
 then 'error' else 'completed' end where id=c.id and status='running';
 end if;
end $$;

create function public.prospecting_metrics(p_campaign uuid) returns jsonb
language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('found',count(*),'enriched',count(enriched_at),'audited',count(audited_at),
 'qualified',count(*) filter(where current_score>=c.min_score and not manually_discarded),
 'highPriority',count(*) filter(where current_score>=85 and not manually_discarded),
 'contacted',count(*) filter(where last_contact_at is not null),
 'replied',count(*) filter(where pipeline_stage in ('replied','meeting','proposal','won')),
 'proposals',count(*) filter(where pipeline_stage in ('proposal','won')))
 from prospecting_campaign_leads cl join prospecting_campaigns c on c.id=cl.campaign_id where cl.campaign_id=p_campaign;
$$;
-- Functions default to PUBLIC execute: explicitly close every entry point.
do $$ declare r record; begin
 for r in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'prospecting_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',r.signature);
 execute format('grant execute on function %s to service_role',r.signature);
 if r.proname in ('prospecting_allowed','prospecting_create_campaign','prospecting_campaign_control','prospecting_change_stage',
 'prospecting_lead_control','prospecting_retry_discovery','prospecting_metrics') then
 execute format('grant execute on function %s to authenticated',r.signature);
 end if;
 end loop;
end $$;
commit;
