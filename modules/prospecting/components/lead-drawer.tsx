'use client'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { X, RefreshCw, ExternalLink } from 'lucide-react'
import { leadDetailsAction, leadControlAction } from '../actions'
import {
  buttonClass,
  dateLabel,
  observed,
  opportunityLabels,
  qualificationLabels,
  safeLink,
  ScoreBadge,
} from './shared'
import { pipelineLabels, type PipelineStage } from '../types/index'
type DetailResult = Awaited<ReturnType<typeof leadDetailsAction>>
type Detail = Extract<DetailResult, { ok: true }>['data']
export function LeadDrawer({
  id,
  canManage,
  onClose,
  onChanged,
}: {
  id: string
  canManage: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [busy, startTransition] = useTransition()
  const load = useCallback(async () => {
    const result = await leadDetailsAction(id)
    if (result.ok) {
      setDetail(result.data)
      setError('')
    } else setError(result.error)
  }, [id])
  useEffect(() => {
    dialog.current?.showModal()
    startTransition(load)
  }, [load])
  const mutate = (action: 'retry' | 'recalculate' | 'refresh' | 'discard' | 'restore') =>
    startTransition(async () => {
      const result = await leadControlAction({ id, action })
      if (!result.ok) setError(result.error)
      else {
        await load()
        onChanged()
      }
    })
  const lead = detail?.lead
  const score = detail?.scores[0]?.result
  return (
    <dialog
      ref={dialog}
      aria-labelledby="lead-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close()
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-3xl border-l border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/40"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs text-slate-500">Detalhe da oportunidade</p>
          <h2 id="lead-title" className="mt-1 text-xl font-bold">
            {lead?.name ?? 'Carregando lead…'}
          </h2>
        </div>
        <button
          aria-label="Fechar detalhe"
          onClick={() => dialog.current?.close()}
          className={buttonClass}
        >
          <X size={18} />
        </button>
      </div>
      <div className="space-y-6 p-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {lead && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <ScoreBadge lead={lead} />
              <span className="text-sm">{qualificationLabels[lead.qualification_status]}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs">
                Comercial: {pipelineLabels[lead.pipeline_stage]}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Fact label="Categoria" value={lead.business.category} />
              <Fact label="Localização" value={`${lead.city ?? '—'} / ${lead.state ?? '—'}`} />
              <Fact
                label="Rating / avaliações"
                value={`${lead.rating ?? '—'} / ${lead.reviews ?? '—'}`}
              />
              <Fact label="Telefone" value={lead.phone} />
              <Fact label="E-mail" value={lead.email} />
              <Fact
                label="Oportunidade"
                value={lead.opportunity_type ? opportunityLabels[lead.opportunity_type] : null}
              />
            </dl>
            {safeLink(lead.website) && (
              <a
                href={safeLink(lead.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-2 break-all text-sm text-[#0075FF]"
              >
                {lead.website}
                <ExternalLink size={14} className="shrink-0" />
              </a>
            )}
            {score ? (
              <section>
                <h3 className="mb-3 font-semibold">Por que esse score?</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ['Negócio', `${score.business} / 30`],
                    ['Oportunidade', `${score.opportunity} / 50`],
                    ['Comercial', `${score.commercial} / 20`],
                    ['Penalidades', score.penalties],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="my-3 text-xs text-slate-500">
                  Site: {score.site}/50 · Sistema: {score.system}/50 · O maior bloco compõe o total.
                  Os limites são aplicados após a soma das regras. Versão {score.version}.
                </p>
                <ul className="divide-y divide-slate-100">
                  {score.items.map((item) => (
                    <li key={item.code} className="flex gap-3 py-2 text-sm">
                      <span
                        className={`min-w-10 font-semibold ${item.points < 0 ? 'text-red-600' : 'text-emerald-700'}`}
                      >
                        {item.points > 0 ? '+' : ''}
                        {item.points}
                      </span>
                      <span>
                        {item.explanation}
                        <span className="ml-2 text-xs text-slate-400">
                          {
                            {
                              business: 'Negócio',
                              site: 'Site',
                              system: 'Sistema',
                              commercial: 'Comercial',
                              penalties: 'Penalidade',
                            }[item.group]
                          }
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="text-sm text-slate-500">O score será exibido após o processamento.</p>
            )}
            <section>
              <h3 className="mb-3 font-semibold">Análise do site</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Performance', lead.digital.performance],
                  ['SEO', lead.digital.seo],
                  ['Accessibility', lead.digital.accessibility],
                  ['Best Practices', lead.digital.bestPractices],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 font-semibold">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['WhatsApp', lead.digital.hasWhatsapp],
                  ['Formulário', lead.digital.hasForm],
                  ['Agendamento', lead.digital.hasBooking],
                  ['Área do cliente', lead.digital.hasClientArea],
                  ['CTA', lead.digital.hasCTA],
                  ['Telefone', lead.digital.hasPhone],
                  ['Login', lead.digital.hasLogin],
                  ['Viewport mobile', lead.digital.hasViewport],
                  ['HTTPS', lead.digital.https],
                ].map(([label, value]) => (
                  <Fact
                    key={String(label)}
                    label={String(label)}
                    value={observed(value as boolean | undefined)}
                  />
                ))}
                <Fact label="Tecnologias" value={lead.digital.technologies?.join(', ')} />
                <Fact label="Analytics" value={lead.digital.analytics?.join(', ')} />
                <Fact label="Título" value={lead.digital.title} />
                <Fact label="H1" value={lead.digital.h1} />
                <Fact label="Meta description" value={lead.digital.description} />
              </dl>
              {lead.digital.warnings?.map((w) => (
                <p key={w} className="mt-3 text-xs text-amber-700">
                  {w}
                </p>
              ))}
            </section>
            {detail?.analysis && (
              <section className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Abordagem comercial</h3>
                  <span className="text-xs text-purple-700">Gerado por IA</span>
                </div>
                <dl className="space-y-3 text-sm">
                  {[
                    ['Potencial comercial', detail.analysis.analysis.commercialPotential],
                    ['Problema principal', detail.analysis.analysis.mainProblem],
                    ['Solução recomendada', detail.analysis.analysis.recommendedSolution],
                    ['Argumento comercial', detail.analysis.analysis.salesAngle],
                    ['Resumo', detail.analysis.analysis.summary],
                  ].map(([label, value]) => (
                    <Fact key={label} label={label} value={value} />
                  ))}
                </dl>
                <p className="mt-3 text-xs text-slate-500">
                  Confiança: {Math.round(detail.analysis.analysis.confidence * 100)}% ·{' '}
                  {detail.analysis.model} · {dateLabel(detail.analysis.created_at)}
                  {detail.analysis.score_run_id !== detail.scores[0]?.id &&
                    ' · Análise de um score anterior'}
                </p>
              </section>
            )}
            {detail?.jobs
              .filter((j) => j.error_message)
              .map((job) => (
                <section
                  key={job.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"
                >
                  <h3 className="font-semibold">
                    Não foi possível concluir{' '}
                    {job.type === 'audit_website' ? 'a auditoria deste site' : 'esta etapa'}.
                  </h3>
                  <p className="mt-2">
                    Tentativa: {job.attempts} de {job.max_attempts}
                  </p>
                  <p className="mt-1">{job.error_message}</p>
                  <p className="mt-2 text-xs">
                    {job.status === 'failed'
                      ? 'Tentativas automáticas esgotadas.'
                      : `Nova tentativa automática a partir de ${dateLabel(job.run_after)}.`}
                  </p>
                  {job.status === 'failed' && canManage && (
                    <button
                      disabled={busy}
                      className={`${buttonClass} mt-3`}
                      onClick={() => mutate('retry')}
                    >
                      Tentar novamente
                    </button>
                  )}
                </section>
              ))}
            <details>
              <summary className="cursor-pointer text-sm font-semibold">
                Histórico de scores ({detail?.scores.length})
              </summary>
              <ul className="mt-2 space-y-2 text-sm">
                {detail?.scores.map((run) => (
                  <li key={run.id}>
                    {dateLabel(run.created_at)} · {run.result.final}/100 · versão{' '}
                    {run.scoring_version}
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-semibold">
                Histórico comercial
              </summary>
              <ul className="mt-2 space-y-2 text-sm">
                {detail?.events.map((event) => (
                  <li key={event.id}>
                    {dateLabel(event.created_at)} ·{' '}
                    {pipelineLabels[event.from_stage as PipelineStage]} →{' '}
                    {pipelineLabels[event.to_stage as PipelineStage]}
                  </li>
                ))}
              </ul>
            </details>
            {canManage && (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button
                  disabled={busy}
                  className={buttonClass}
                  onClick={() => mutate('recalculate')}
                >
                  <RefreshCw size={14} />
                  Recalcular score
                </button>
                <button disabled={busy} className={buttonClass} onClick={() => mutate('refresh')}>
                  Atualizar dados
                </button>
                <button
                  disabled={busy}
                  className={buttonClass}
                  onClick={() => mutate(lead.manually_discarded ? 'restore' : 'discard')}
                >
                  {lead.manually_discarded ? 'Restaurar lead' : 'Descartar lead'}
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Dados de estabelecimentos: Google Maps.
              {lead.business.attributions?.map((a) => (
                <span key={a.provider}> {a.provider}</span>
              ))}
            </p>
          </>
        )}
      </div>
    </dialog>
  )
}
function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words">{value || 'Não verificado'}</dd>
    </div>
  )
}
