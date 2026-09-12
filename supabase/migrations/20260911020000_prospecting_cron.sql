-- Deployment helper. Stores no secret in source and does not enable paid API work by itself.
-- Enable pg_cron, pg_net and Vault in Supabase first; then configure Vault secrets per docs.
begin;
create function public.prospecting_install_cron() returns bigint
language plpgsql security definer set search_path=public as $$
declare v_id bigint;
begin
 if not exists(select 1 from pg_extension where extname='pg_cron') or not exists(select 1 from pg_extension where extname='pg_net')
 then raise exception 'Habilite pg_cron e pg_net antes de instalar o agendamento.'; end if;
 if not exists(select 1 from vault.decrypted_secrets where name='prospecting_project_url')
 or not exists(select 1 from vault.decrypted_secrets where name='prospecting_worker_secret')
 then raise exception 'Configure os secrets de Prospecção no Vault.'; end if;
 select cron.schedule('prospecting-worker','* * * * *',$cron$
 select net.http_post(
 url := (select decrypted_secret from vault.decrypted_secrets where name='prospecting_project_url') || '/functions/v1/prospecting-worker',
 headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
 (select decrypted_secret from vault.decrypted_secrets where name='prospecting_worker_secret')),
 body := '{}'::jsonb, timeout_milliseconds := 90000);
 $cron$) into v_id;
 return v_id;
end $$;
revoke all on function public.prospecting_install_cron() from public,anon,authenticated;
grant execute on function public.prospecting_install_cron() to service_role;
commit;
