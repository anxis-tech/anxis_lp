'use client'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  campaignControlAction,
  changePipelineAction,
  createCampaignAction,
  loadProspectingAction,
  retryDiscoveryAction,
} from '../actions'
import type { LeadFilters } from '../schemas/lead.schema'
import { segments, type Segment } from '../schemas/campaign.schema'
import { emptyMetrics, pipelineLabels, pipelineStages, type PipelineStage } from '../types/index'
import { CampaignForm } from './campaign-form'
import { LeadFiltersPanel } from './lead-filters'
import { ContactActions } from './contact-actions'
import { LeadDrawer } from './lead-drawer'
import {
  buttonClass,
  dateLabel,
  inputClass,
  opportunityLabels,
  qualificationLabels,
  ScoreBadge,
} from './shared'
import { classificationLabels } from '../scoring/classification'
import { PAGE_SIZE } from '../repositories/lead.repository'
type WorkspaceData = Extract<
  Awaited<ReturnType<typeof loadProspectingAction>>,
  { ok: true }
>['data']
const initialData: WorkspaceData = {
  campaigns: [],
  campaign: null,
  leads: [],
  total: 0,
  metrics: emptyMetrics,
  jobs: [],
}
const statusLabels = {
  running: 'Em processamento',
  paused: 'Pausada',
  completed: 'Concluída',
  error: 'Concluída com pendências',
}
export function ProspectingWorkspace({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<WorkspaceData>(initialData)
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, sort: 'score' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, startTransition] = useTransition()
  const sequence = useRef(0)
  const load = useCallback(async () => {
    const current = ++sequence.current
    const result = await loadProspectingAction(filters)
    if (current !== sequence.current) return
    if (result.ok) {
      setData(result.data)
      setSelected(
        (current) =>
          new Set([...current].filter((id) => result.data.leads.some((lead) => lead.id === id)))
      )
      setError('')
    } else setError(result.error)
    setLoading(false)
  }, [filters])
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      await load()
      if (!stopped) timer = setTimeout(() => startTransition(poll), 6000)
    }
    startTransition(poll)
    const requestSequence = sequence
    return () => {
      stopped = true
      clearTimeout(timer)
      requestSequence.current++
    }
  }, [load])
  function changeFilters(next: LeadFilters) {
    setSelected(new Set())
    setFilters(next)
    setLoading(true)
  }
  const create = (raw: unknown) =>
    startTransition(async () => {
      const result = await createCampaignAction(raw)
      if (result.ok) {
        setNotice('Campanha criada. O worker iniciará a busca no próximo ciclo.')
        changeFilters({ page: 1, sort: 'score', campaignId: result.data })
      } else setError(result.error)
    })
  const changeStage = (ids: string[], stage: PipelineStage) =>
    startTransition(async () => {
      const result = await changePipelineAction({ ids, stage })
      if (!result.ok) setError(result.error)
      else {
        setNotice('Status comercial atualizado.')
        setSelected(new Set())
        await load()
      }
    })
  const controlCampaign = () =>
    startTransition(async () => {
      if (!data.campaign) return
      const result = await campaignControlAction({
        id: data.campaign.id,
        status: data.campaign.status === 'paused' ? 'running' : 'paused',
      })
      if (!result.ok) setError(result.error)
      else await load()
    })
  const contact = (channel: 'WhatsApp' | 'E-mail') =>
    setNotice(
      `${channel}: integração não configurada. Nenhuma mensagem foi enviada. ${selected.size ? `${selected.size} leads selecionados para uma futura campanha de contato.` : 'O envio por API oficial será habilitado em uma próxima etapa.'}`
    )
  const allChecked = data.leads.length > 0 && data.leads.every((l) => selected.has(l.id))
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const metricCards = [
    ['Encontrados', data.metrics.found],
    ['Qualificados', data.metrics.qualified],
    ['Alta prioridade', data.metrics.highPriority],
    ['Contatados', data.metrics.contacted],
    ['Responderam', data.metrics.replied],
    ['Propostas', data.metrics.proposals],
  ] as const
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-5 sm:px-6">
        <CampaignForm disabled={!canManage} busy={busy} onCreate={create} />
        {!canManage && (
          <p className="text-xs text-slate-500">
            Acesso de leitura. Para criar campanhas e atualizar leads, solicite a permissão
            Gerenciar Prospecção.
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              className={buttonClass}
              onClick={() =>
                startTransition(() => {
                  void load()
                })
              }
            >
              Tentar novamente
            </button>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
          >
            <p>{notice}</p>
            <button onClick={() => setNotice('')} className="shrink-0 text-xs underline">
              Fechar
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-slate-500" htmlFor="current-campaign">
              Campanha
            </label>
            <select
              id="current-campaign"
              value={data.campaign?.id ?? ''}
              onChange={(e) =>
                changeFilters({ campaignId: e.target.value, page: 1, sort: 'score' })
              }
              className={`${inputClass} max-w-full`}
              disabled={!data.campaigns.length}
            >
              <option value="" disabled>
                Nenhuma campanha
              </option>
              {data.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {segments[c.segment as Segment]?.label ?? c.segment} · {c.city}/{c.state} ·{' '}
                  {dateLabel(c.created_at)}
                </option>
              ))}
            </select>
            {data.campaign && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${data.campaign.status === 'running' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'}`}
              >
                {statusLabels[data.campaign.status]}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {canManage && data.campaign && ['running', 'paused'].includes(data.campaign.status) && (
              <button onClick={controlCampaign} disabled={busy} className={buttonClass}>
                {data.campaign.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                {data.campaign.status === 'paused' ? 'Retomar' : 'Pausar'}
              </button>
            )}
            <button
              title="Atualizar dados"
              aria-label="Atualizar dados"
              disabled={busy}
              onClick={() =>
                startTransition(() => {
                  void load()
                })
              }
              className={buttonClass}
            >
              <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {value.toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
        {data.campaign && (
          <div
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600"
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>
                Encontrados: <strong>{data.metrics.found}</strong>
              </span>
              <span>
                Enriquecidos: <strong>{data.metrics.enriched}</strong>
              </span>
              <span>
                Auditados: <strong>{data.metrics.audited}</strong>
              </span>
              <span>
                Qualificados: <strong>{data.metrics.qualified}</strong> (score ≥{' '}
                {data.campaign.min_score})
              </span>
            </div>
            <p className="mt-2">
              {data.campaign.status === 'running'
                ? 'Estamos analisando as empresas encontradas. Novos leads aparecerão nesta lista automaticamente.'
                : data.campaign.status === 'paused'
                  ? 'Processamento pausado. Etapas já em execução podem terminar; novos jobs aguardam a retomada.'
                  : data.campaign.discovery_note}
            </p>
          </div>
        )}
        {data.jobs.some((j) => j.error_message) && (
          <details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-amber-900">
              Pendências de processamento
            </summary>
            <ul className="mt-3 space-y-3">
              {data.jobs
                .filter((j) => j.error_message)
                .map((j) => (
                  <li key={j.id}>
                    <p className="text-amber-900">{j.error_message}</p>
                    <p className="mt-1 text-xs text-amber-800">
                      Tentativa {j.attempts} de {j.max_attempts} ·{' '}
                      {j.status === 'failed'
                        ? 'Tentativas esgotadas'
                        : `Nova tentativa a partir de ${dateLabel(j.run_after)}`}
                    </p>
                    {j.campaign_lead_id ? (
                      <button
                        className="mt-1 text-xs text-blue-700 underline"
                        onClick={() => setDetailId(j.campaign_lead_id)}
                      >
                        Abrir lead
                      </button>
                    ) : (
                      canManage &&
                      j.status === 'failed' && (
                        <button
                          className={`${buttonClass} mt-2`}
                          disabled={busy}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await retryDiscoveryAction(j.campaign_id)
                              if (!r.ok) setError(r.error)
                              else await load()
                            })
                          }
                        >
                          Repetir busca
                        </button>
                      )
                    )}
                  </li>
                ))}
            </ul>
          </details>
        )}
        <LeadFiltersPanel filters={filters} onChange={changeFilters} />
        <section
          aria-label="Leads encontrados"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Leads</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {data.total}
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Ordenar por
              <select
                value={filters.sort}
                onChange={(e) =>
                  changeFilters({
                    ...filters,
                    page: 1,
                    sort: e.target.value as LeadFilters['sort'],
                  })
                }
                className={inputClass}
              >
                <option value="score">Maior score</option>
                <option value="reviews">Mais avaliações</option>
                <option value="rating">Maior rating</option>
                <option value="performance">Pior performance</option>
                <option value="recent">Mais recente</option>
              </select>
            </label>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50 px-4 py-2">
              <span className="text-xs font-semibold text-blue-800">
                {selected.size} leads selecionados nesta página
              </span>
              <ContactActions onContact={contact} />
              {canManage && (
                <select
                  aria-label="Alterar status dos leads selecionados"
                  value=""
                  disabled={busy}
                  onChange={(e) => changeStage([...selected], e.target.value as PipelineStage)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Alterar status
                  </option>
                  {pipelineStages.map((s) => (
                    <option key={s} value={s}>
                      {pipelineLabels[s]}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os leads desta página"
                      checked={allChecked}
                      onChange={() =>
                        setSelected(allChecked ? new Set() : new Set(data.leads.map((l) => l.id)))
                      }
                    />
                  </th>
                  {[
                    'Empresa',
                    'Cidade',
                    'Score',
                    'Classificação',
                    'Oportunidade',
                    'Rating',
                    'Avaliações',
                    'Site',
                    'Contato',
                    'Último contato',
                    'Status comercial',
                    'Ações',
                  ].map((label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${lead.name}`}
                        checked={selected.has(lead.id)}
                        onChange={() => toggle(lead.id)}
                      />
                    </td>
                    <td className="max-w-56 px-3 py-3">
                      <button
                        onClick={() => setDetailId(lead.id)}
                        className="text-left font-semibold text-slate-800 hover:text-blue-600"
                      >
                        {lead.name}
                      </button>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {segments[lead.segment as Segment]?.label ?? lead.segment}
                        {lead.ai_analyzed && ' · IA'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3">
                      {lead.city ?? '—'}/{lead.state ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3">
                      <ScoreBadge lead={lead} />
                    </td>
                    <td className="px-3">
                      {lead.manually_discarded
                        ? 'Descartado manualmente'
                        : lead.classification
                          ? classificationLabels[
                              lead.classification as keyof typeof classificationLabels
                            ]
                          : qualificationLabels[lead.qualification_status]}
                      {lead.qualification_status === 'error' && lead.classification && (
                        <p className="mt-1 text-amber-700">Etapa com falha</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3">
                      {lead.opportunity_type ? opportunityLabels[lead.opportunity_type] : '—'}
                    </td>
                    <td className="px-3">{lead.rating ?? '—'}</td>
                    <td className="px-3">{lead.reviews?.toLocaleString('pt-BR') ?? '—'}</td>
                    <td className="whitespace-nowrap px-3">
                      {lead.website_kind === 'none'
                        ? 'Sem site'
                        : lead.website_kind === 'social'
                          ? 'Somente social'
                          : lead.bad_website
                            ? 'Site ruim'
                            : lead.website
                              ? 'Possui site'
                              : 'Aguardando'}
                    </td>
                    <td className="px-3">
                      <ContactActions compact onContact={contact} />
                    </td>
                    <td className="whitespace-nowrap px-3 text-slate-500">
                      {dateLabel(lead.last_contact_at)}
                    </td>
                    <td className="px-3">
                      <select
                        aria-label={`Status comercial de ${lead.name}`}
                        value={lead.pipeline_stage}
                        disabled={!canManage || busy}
                        onChange={(e) => changeStage([lead.id], e.target.value as PipelineStage)}
                        className={`${inputClass} text-xs`}
                      >
                        {pipelineStages.map((s) => (
                          <option key={s} value={s}>
                            {pipelineLabels[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3">
                      <button
                        className="font-medium text-[#0075FF]"
                        onClick={() => setDetailId(lead.id)}
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.leads.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
              {loading ? (
                <LoaderCircle className="animate-spin text-slate-400" size={24} />
              ) : (
                <Search className="text-slate-300" size={28} />
              )}
              <p className="font-medium text-slate-700">
                {loading
                  ? 'Carregando oportunidades…'
                  : error
                    ? 'Não foi possível carregar os leads.'
                    : !data.campaign
                      ? 'Nenhuma campanha executada ainda.'
                      : 'Nenhum lead encontrado com esses filtros.'}
              </p>
              <p className="max-w-lg text-sm text-slate-500">
                {!data.campaign
                  ? 'Selecione segmento e localização acima para encontrar suas primeiras oportunidades.'
                  : data.campaign.status === 'running'
                    ? 'Os resultados aparecerão automaticamente conforme o processamento avançar.'
                    : 'Ajuste os filtros para consultar outras oportunidades.'}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Página {filters.page} de {Math.max(1, Math.ceil(data.total / PAGE_SIZE))} ·{' '}
              {data.total} leads
            </span>
            <div className="flex gap-2">
              <button
                aria-label="Página anterior"
                className={buttonClass}
                disabled={filters.page <= 1 || loading}
                onClick={() => changeFilters({ ...filters, page: filters.page - 1 })}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                aria-label="Próxima página"
                className={buttonClass}
                disabled={filters.page * PAGE_SIZE >= data.total || loading}
                onClick={() => changeFilters({ ...filters, page: filters.page + 1 })}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>
        <p className="text-xs text-slate-400">
          Dados de estabelecimentos fornecidos pelo Google Maps. Scores calculados por regras
          determinísticas; análises de IA são identificadas separadamente.
        </p>
      </div>
      {detailId && (
        <LeadDrawer
          key={detailId}
          id={detailId}
          canManage={canManage}
          onClose={() => setDetailId(null)}
          onChanged={() =>
            startTransition(() => {
              void load()
            })
          }
        />
      )}
    </div>
  )
}
