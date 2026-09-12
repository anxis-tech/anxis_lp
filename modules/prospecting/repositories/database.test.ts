import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const user = '00000000-0000-4000-8000-000000000001'
const outsider = '00000000-0000-4000-8000-000000000002'
const worker = '00000000-0000-4000-8000-000000000010'
const worker2 = '00000000-0000-4000-8000-000000000011'
test('migrations, RLS, transactional jobs, dedupe, score history and retries in PostgreSQL', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public, auth to authenticated,service_role,anon;
      create table profiles(user_id uuid, is_active boolean, is_super_admin boolean, custom_permissions jsonb);
      insert into auth.users values('${user}'),('${outsider}');
      insert into profiles values('${user}',true,false,'{"prospecting.view":true,"prospecting.manage":true}'),('${outsider}',true,false,'{}');`)
    for (const file of [
      '20260911000000_prospecting.sql',
      '20260911010000_prospecting_rules.sql',
      '20260911020000_prospecting_cron.sql',
      '20260912000000_prospecting_realtime.sql',
      '20260912010000_prospecting_pipeline_v2.sql',
      '20260912020000_prospecting_pipeline_v3.sql',
    ])
      await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'))
    const login = async (id: string) =>
      db.exec(
        `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`
      )
    await login(user)
    const campaignData = {
      segment: 'clinic',
      city: 'Natal',
      state: 'RN',
      volume: 100,
      min_score: 55,
      ai_score_threshold: 85,
      search_terms: ['clínica'],
    }
    const created = await db.query<{ id: string }>('select prospecting_create_campaign($1) as id', [
      JSON.stringify(campaignData),
    ])
    const campaign = created.rows[0].id
    assert.equal((await db.query('select * from prospecting_campaigns')).rows.length, 1)
    await login(outsider)
    assert.equal((await db.query('select * from prospecting_campaigns')).rows.length, 0)
    await assert.rejects(
      db.query('select prospecting_create_campaign($1)', [JSON.stringify(campaignData)]),
      /Sem permissão/
    )
    await assert.rejects(
      db.query('select prospecting_claim_jobs($1,5)', [worker]),
      /permission denied/
    )
    await login(user)
    await assert.rejects(
      db.query('update prospecting_campaigns set volume=1000'),
      /permission denied/
    )
    await db.exec('reset role; set role service_role;')
    const claim = async (owner = worker) =>
      (
        await db.query<{ id: string; type: string; attempts: number; campaign_lead_id: string }>(
          'select * from prospecting_claim_jobs($1,5)',
          [owner]
        )
      ).rows
    const complete = async (id: string, result: unknown, owner = worker) =>
      db.query('select prospecting_complete_job($1,$2,$3)', [id, owner, JSON.stringify(result)])
    const jobs = await claim()
    assert.equal(jobs.length, 1)
    assert.equal((await claim(worker2)).length, 0)
    await complete(
      jobs[0].id,
      { places: [{ id: 'place-1' }, { id: 'place-1' }], next: null },
      worker2
    )
    assert.equal((await db.query('select * from prospecting_leads')).rows.length, 0)
    await complete(jobs[0].id, { places: [{ id: 'place-1' }, { id: 'place-1' }], next: null })
    await complete(jobs[0].id, { places: [{ id: 'place-2' }], next: null })
    assert.equal((await db.query('select * from prospecting_leads')).rows.length, 1)
    assert.equal((await db.query('select * from prospecting_campaign_leads')).rows.length, 1)
    const enrich = (await claim())[0]
    assert.equal(enrich.type, 'enrich_lead')
    await complete(enrich.id, {
      business: { name: 'Clínica', city: 'Natal', state: 'RN', reviews: 482, rating: 4.8 },
      digital: { websiteKind: 'none' },
      signals: [{ code: 'NO_WEBSITE' }],
    })
    const scoreJob = (await claim())[0]
    assert.equal(scoreJob.type, 'calculate_score')
    const score = {
      version: '1.0',
      final: 90,
      classification: 'high',
      qualificationStatus: 'highly_qualified',
      opportunityType: 'website',
      useAI: true,
      items: [{ code: 'NO_WEBSITE', group: 'site', points: 35, explanation: 'Sem site' }],
    }
    await assert.rejects(
      complete(scoreJob.id, {
        score: { ...score, items: [{ ...score.items[0], points: 'invalid' }] },
        input: {},
        rules: [],
      })
    )
    assert.equal((await db.query('select * from prospecting_score_runs')).rows.length, 0)
    await complete(scoreJob.id, { score, input: {}, rules: [] })
    await complete(scoreJob.id, { score, input: {}, rules: [] })
    assert.equal((await db.query('select * from prospecting_score_runs')).rows.length, 1)
    const ai = (await claim())[0]
    assert.equal(ai.type, 'analyze_ai')
    await complete(ai.id, { model: 'test', analysis: { summary: 'Test' } })
    await complete(ai.id, { model: 'test', analysis: {} })
    assert.equal((await db.query('select * from prospecting_ai_analyses')).rows.length, 1)
    assert.equal(
      (await db.query<{ status: string }>('select status from prospecting_campaigns')).rows[0]
        .status,
      'completed'
    )
    await login(user)
    const cl = enrich.campaign_lead_id
    await db.query('select prospecting_change_stage($1,$2)', [[cl], 'contacted'])
    await db.query('select prospecting_change_stage($1,$2)', [[cl], 'contacted'])
    assert.equal((await db.query('select * from prospecting_pipeline_events')).rows.length, 1)
    const metrics = await db.query<{ m: { found: number; contacted: number } }>(
      'select prospecting_metrics($1) as m',
      [campaign]
    )
    assert.equal(metrics.rows[0].m.found, 1)
    assert.equal(metrics.rows[0].m.contacted, 1)
    await db.query('select prospecting_lead_control($1,$2)', [cl, 'refresh'])
    await db.query('select prospecting_lead_control($1,$2)', [cl, 'refresh'])
    await db.exec('reset role; set role service_role;')
    const retry = (await claim())[0]
    assert.equal(retry.type, 'refresh_lead')
    assert.equal((await claim()).length, 0)
    await db.query('select prospecting_fail_job($1,$2,$3)', [retry.id, worker, 'Timeout'])
    assert.equal((await claim()).length, 0)
    await db.query("update prospecting_jobs set run_after=now()-interval '1 second' where id=$1", [
      retry.id,
    ])
    assert.equal((await claim())[0].attempts, 2)
    await db.query('select prospecting_fail_job($1,$2,$3)', [retry.id, worker, 'Timeout'])
    await db.query("update prospecting_jobs set run_after=now()-interval '1 second' where id=$1", [
      retry.id,
    ])
    assert.equal((await claim())[0].attempts, 3)
    await db.query('select prospecting_fail_job($1,$2,$3)', [retry.id, worker, 'Timeout'])
    assert.equal(
      (
        await db.query<{ status: string }>('select status from prospecting_jobs where id=$1', [
          retry.id,
        ])
      ).rows[0].status,
      'failed'
    )
    await login(user)
    await db.query('select prospecting_lead_control($1,$2)', [cl, 'retry'])
    await db.query('select prospecting_campaign_control($1,$2)', [campaign, 'paused'])
    await db.exec('reset role; set role service_role;')
    assert.equal((await claim()).length, 0)
    await login(user)
    await db.query('select prospecting_campaign_control($1,$2)', [campaign, 'running'])
    await db.exec('reset role; set role service_role;')
    const revived = (await claim())[0]
    assert.equal(revived.id, retry.id)
    await login(user)
    await db.query('select prospecting_lead_control($1,$2)', [cl, 'discard'])
    await db.exec('reset role; set role service_role;')
    await complete(revived.id, { business: { name: 'Should not update' }, digital: {} })
    assert.equal(
      (await db.query<{ name: string }>('select name from prospecting_leads')).rows[0].name,
      'Clínica'
    )
    assert.equal((await claim()).length, 0)
    assert.equal(
      (
        await db.query<{ status: string }>('select status from prospecting_campaigns where id=$1', [
          campaign,
        ])
      ).rows[0].status,
      'completed'
    )
    await login(user)
    await db.query('select prospecting_lead_control($1,$2)', [cl, 'restore'])
    await db.exec('reset role; set role service_role;')
    const leased = (await claim())[0]
    await db.query(
      "update prospecting_jobs set locked_at=now()-interval '11 minutes' where id=$1",
      [leased.id]
    )
    assert.equal((await claim(worker2)).length, 0)
    await db.query("update prospecting_jobs set run_after=now()-interval '1 second' where id=$1", [
      leased.id,
    ])
    assert.equal((await claim(worker2))[0].id, leased.id)
    await complete(leased.id, { score, input: {}, rules: [] })
    assert.equal((await db.query('select * from prospecting_score_runs')).rows.length, 1)
    await complete(leased.id, { score: { ...score, useAI: false }, input: {}, rules: [] }, worker2)
    assert.equal((await db.query('select * from prospecting_score_runs')).rows.length, 2)
    await login(user)
    const second = (
      await db.query<{ id: string }>('select prospecting_create_campaign($1) as id', [
        JSON.stringify(campaignData),
      ])
    ).rows[0].id
    await db.exec('reset role; set role service_role;')
    const secondDiscover = (await claim())[0]
    await complete(secondDiscover.id, {
      places: [{ id: 'place-new', displayName: { text: 'Clínica Especializada' } }],
      next: null,
    })
    assert.equal((await db.query('select * from prospecting_leads')).rows.length, 2)
    assert.equal(
      (
        await db.query<{ name: string }>(
          'select name from prospecting_leads where google_place_id=$1',
          ['place-new']
        )
      ).rows[0].name,
      'Clínica Especializada'
    )
    assert.equal((await db.query('select * from prospecting_campaign_leads')).rows.length, 2)
    const secondEnrich = (await claim())[0]
    // Test heartbeat renewal
    const beforeHb = (
      await db.query<{ locked_at: string }>(
        'select locked_at from prospecting_jobs where id=$1',
        [secondEnrich.id]
      )
    ).rows[0].locked_at
    await db.query('select prospecting_heartbeat($1,$2)', [worker, [secondEnrich.id]])
    const afterHb = (
      await db.query<{ locked_at: string }>(
        'select locked_at from prospecting_jobs where id=$1',
        [secondEnrich.id]
      )
    ).rows[0].locked_at
    assert.ok(new Date(afterHb).getTime() >= new Date(beforeHb).getTime())
    await login(user)
    await db.query('select prospecting_campaign_control($1,$2)', [second, 'paused'])
    await db.exec('reset role; set role service_role;')
    await complete(secondEnrich.id, {
      business: { name: 'Clínica' },
      digital: { websiteKind: 'none' },
      signals: [],
    })
    assert.equal((await claim()).length, 0)
    await login(user)
    await db.query('select prospecting_campaign_control($1,$2)', [second, 'running'])
    await db.exec('reset role; set role service_role;')
    const secondScore = (await claim())[0]
    await login(user)
    await db.query('select prospecting_campaign_control($1,$2)', [second, 'paused'])
    await db.exec('reset role; set role service_role;')
    await complete(secondScore.id, { score: { ...score, useAI: false }, input: {}, rules: [] })
    await login(user)
    await db.query('select prospecting_campaign_control($1,$2)', [second, 'running'])
    assert.equal(
      (
        await db.query<{ status: string }>('select status from prospecting_campaigns where id=$1', [
          second,
        ])
      ).rows[0].status,
      'completed'
    )
    await db.exec('reset role;')
    await db.query('update profiles set is_active=false where user_id=$1', [user])
    await login(user)
    assert.equal((await db.query('select * from prospecting_lead_list')).rows.length, 0)
  } finally {
    await db.close()
  }
})
