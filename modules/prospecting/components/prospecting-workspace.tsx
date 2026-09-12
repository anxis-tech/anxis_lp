'use client'
import { memo, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  campaignControlAction,
  changePipelineAction,
  createCampaignAction,
  getLeadRowAction,
  loadProspectingAction,
  refreshAggregatesAction,
  retryDiscoveryAction,
} from '../actions'
import type { LeadFilters } from '../schemas/lead.schema'
import { segments, type Segment } from '../schemas/campaign.schema'
import {
  emptyMetrics,
  pipelineLabels,
  pipelineStages,
  type Campaign,
  type Job,
  type LeadRow,
  type Metrics,
  type PipelineStage,
} from '../types/index'
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// Aggregate data updated by the light poller (30 s), separate from the lead list.
interface AggregateState {
  campaign: Campaign | null
  metrics: Metrics
  jobs: Job[]
}

// ---------------------------------------------------------------------------
// Memoised table row — only re-renders when its own lead data, selection
// state or busy flag change. Stable object reference equality is enough
// because getLeadRowAction returns a new object only when a field changed.
// ---------------------------------------------------------------------------

interface LeadRowProps {
  lead: LeadRow
  isSelected: boolean
  canManage: boolean
  busy: boolean
  onToggle: (id: string) => void
  onDetail: (id: string) => void
  onStageChange: (ids: string[], stage: PipelineStage) => void
  onContact: (channel: 'WhatsApp' | 'E-mail') => void
}

const LeadTableRow = memo(function LeadTableRow({
  lead,
  isSelected,
  canManage,
  busy,
  onToggle,
  onDetail,
  onStageChange,
  onContact,
}: LeadRowProps) {
  return (
    <tr key={lead.id} className="hover:bg-slate-50/70">
      <td className="p-3">
        <input
          type="checkbox"
          aria-label={`Selecionar ${lead.name}`}
          checked={isSelected}
          onChange={() => onToggle(lead.id)}
        />
      </td>
      <td className="max-w-56 px-3 py-3">
        <button
          onClick={() => onDetail(lead.id)}
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
            ? classificationLabels[lead.classification as keyof typeof classificationLabels]
            : qualificationLabels[lead.qualification_status]}
        {lead.audit_failure_code && lead.audit_failure_code !== 'AUDIT_BLOCKED' && (
          <p className="mt-0.5 text-[11px] font-medium text-amber-700">
            {lead.audit_failure_code === 'WEBSITE_DNS_FAILURE'
              ? 'DNS do site inexistente'
              : lead.audit_failure_code === 'WEBSITE_TLS_ERROR'
                ? 'Certificado SSL/TLS inválido'
                : 'Site fora do ar'}
          </p>
        )}
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
        {lead.website_kind === 'none' ? (
          'Sem site'
        ) : lead.website_kind === 'social' ? (
          'Somente social'
        ) : lead.audit_failure_code ? (
          <div className="max-w-44">
            <span
              className={`font-medium ${lead.audit_failure_code === 'AUDIT_BLOCKED' ? 'text-slate-600' : 'text-amber-700'}`}
            >
              {lead.audit_failure_code === 'WEBSITE_DNS_FAILURE'
                ? 'DNS inexistente'
                : lead.audit_failure_code === 'WEBSITE_TLS_ERROR'
                  ? 'Erro de SSL/TLS'
                  : lead.audit_failure_code === 'AUDIT_BLOCKED'
                    ? 'Audit bloqueada'
                    : 'Site indisponível'}
            </span>
            {lead.audit_failure_detail && (
              <p
                className="truncate text-[10px] text-slate-400"
                title={lead.audit_failure_detail}
              >
                {lead.audit_failure_detail}
              </p>
            )}
          </div>
        ) : lead.bad_website ? (
          'Site ruim'
        ) : lead.website ? (
          'Possui site'
        ) : (
          'Aguardando'
        )}
      </td>
      <td className="px-3">
        <ContactActions compact onContact={onContact} />
      </td>
      <td className="whitespace-nowrap px-3 text-slate-500">
        {dateLabel(lead.last_contact_at)}
      </td>
      <td className="px-3">
        <select
          aria-label={`Status comercial de ${lead.name}`}
          value={lead.pipeline_stage}
          disabled={!canManage || busy}
          onChange={(e) => onStageChange([lead.id], e.target.value as PipelineStage)}
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
          onClick={() => onDetail(lead.id)}
        >
          Detalhes
        </button>
      </td>
    </tr>
  )
},
// Custom comparator — avoids renders when nothing visible changed.
(prev, next) =>
  prev.lead === next.lead &&
  prev.isSelected === next.isSelected &&
  prev.busy === next.busy &&
  prev.canManage === next.canManage
)

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function ProspectingWorkspace({ canManage }: { canManage: boolean }) {
  // ── Full data state (set on initial load and filter/page changes only) ───
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [total, setTotal] = useState(0)
  const [campaigns, setCampaigns] = useState<WorkspaceData['campaigns']>([])

  // ── Aggregate state (set by light 30-s poller and after mutations) ───────
  const [agg, setAgg] = useState<AggregateState>({
    campaign: null,
    metrics: emptyMetrics,
    jobs: [],
  })

  // ── UI state ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, sort: 'score' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, startTransition] = useTransition()

  // ── Sequence counter — cancels stale async responses ─────────────────────
  const sequence = useRef(0)

  // ── Refs for cleanup ──────────────────────────────────────────────────────
  const realtimeChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const aggPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Pending Realtime invalidation IDs (deduplication) ────────────────────
  // We batch rapid successive events for the same lead so we don't fire
  // multiple concurrent fetches for a single row.
  const pendingInvalidations = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // =========================================================================
  // Full load — campaigns + leads + metrics + jobs
  // Called on: mount, filter change, campaign change, pagination, manual refresh
  // =========================================================================
  const load = useCallback(async (filtersArg: LeadFilters) => {
    const current = ++sequence.current
    const result = await loadProspectingAction(filtersArg)
    if (current !== sequence.current) return   // superseded
    if (result.ok) {
      const d = result.data
      setCampaigns(d.campaigns)
      setLeads(d.leads)
      setTotal(d.total)
      setAgg({ campaign: d.campaign, metrics: d.metrics, jobs: d.jobs })
      setSelected((prev) => new Set([...prev].filter((id) => d.leads.some((l) => l.id === id))))
      setError('')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  // =========================================================================
  // Light aggregate refresh — campaign status + metrics + jobs only
  // Does NOT touch the lead list. Called by the 30-s interval.
  // =========================================================================
  const refreshAggregates = useCallback(async (campaignId: string) => {
    const result = await refreshAggregatesAction(campaignId)
    if (result.ok) {
      setAgg((prev) => ({
        campaign: result.data.campaign,
        metrics: result.data.metrics,
        jobs: result.data.jobs,
      }))
    }
  }, [])

  // =========================================================================
  // Single-row invalidation — fetch one lead from the view and patch state
  // Called when Realtime delivers INSERT/UPDATE for prospecting_campaign_leads
  // =========================================================================
  const invalidateLead = useCallback(async (campaignLeadId: string) => {
    const result = await getLeadRowAction(campaignLeadId)
    if (!result.ok) return
    const updated = result.data
    setLeads((prev) => {
      const idx = prev.findIndex((l) => l.id === updated.id)
      if (idx === -1) {
        // New lead that belongs to the current page's filter — prepend it.
        // A full load will re-sort properly; this gives immediate feedback.
        return [updated, ...prev]
      }
      const next = [...prev]
      next[idx] = updated
      return next
    })
  }, [])

  // =========================================================================
  // Realtime subscription — scoped to the active campaign
  // =========================================================================
  const subscribeToLeads = useCallback((campaignId: string) => {
    // Remove previous channel before creating a new one.
    if (realtimeChannelRef.current) {
      createClient().removeChannel(realtimeChannelRef.current)
      realtimeChannelRef.current = null
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`prospecting_leads:${campaignId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'prospecting_campaign_leads',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload: any) => {
          const id: string | undefined = payload.new?.id ?? payload.old?.id
          if (!id) return

          // Debounce: if the same lead fires multiple events rapidly (e.g.
          // enrichment + immediate score), wait 200 ms before fetching so we
          // only make one round-trip per burst.
          const existing = pendingInvalidations.current.get(id)
          if (existing) clearTimeout(existing)
          const timer = setTimeout(() => {
            pendingInvalidations.current.delete(id)
            startTransition(() => { void invalidateLead(id) })
          }, 200)
          pendingInvalidations.current.set(id, timer)
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel
  }, [invalidateLead])

  // =========================================================================
  // Light aggregate poller — 30 s, only while campaign is running
  // =========================================================================
  useEffect(() => {
    const campaignId = agg.campaign?.id
    const isRunning = agg.campaign?.status === 'running'

    if (aggPollRef.current) {
      clearInterval(aggPollRef.current)
      aggPollRef.current = null
    }

    if (!campaignId || !isRunning) return

    aggPollRef.current = setInterval(() => {
      startTransition(() => { void refreshAggregates(campaignId) })
    }, 30_000)

    return () => {
      if (aggPollRef.current) clearInterval(aggPollRef.current)
    }
  }, [agg.campaign?.id, agg.campaign?.status, refreshAggregates])

  // =========================================================================
  // Subscribe / unsubscribe when campaign changes
  // =========================================================================
  useEffect(() => {
    const campaignId = agg.campaign?.id
    if (!campaignId) return
    subscribeToLeads(campaignId)
  }, [agg.campaign?.id, subscribeToLeads])

  // =========================================================================
  // Initial load
  // =========================================================================
  useEffect(() => {
    setLoading(true)
    startTransition(() => { void load(filters) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount; filter changes handled by changeFilters below.

  // =========================================================================
  // Global cleanup on unmount
  // =========================================================================
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        createClient().removeChannel(realtimeChannelRef.current)
      }
      if (aggPollRef.current) {
        clearInterval(aggPollRef.current)
      }
      // Cancel any pending debounce timers.
      pendingInvalidations.current.forEach((t) => clearTimeout(t))
      pendingInvalidations.current.clear()
      sequence.current++ // cancel any in-flight load()
    }
  }, [])

  // =========================================================================
  // Helpers
  // =========================================================================

  function changeFilters(next: LeadFilters) {
    setSelected(new Set())
    setFilters(next)
    setLoading(true)
    startTransition(() => { void load(next) })
  }

  const create = (raw: unknown) =>
    startTransition(async () => {
      const result = await createCampaignAction(raw)
      if (result.ok) {
        setNotice('Campanha criada. O worker iniciará a busca no próximo ciclo.')
        const next: LeadFilters = { page: 1, sort: 'score', campaignId: result.data }
        setFilters(next)
        setLoading(true)
        await load(next)
      } else setError(result.error)
    })

  const changeStage = (ids: string[], stage: PipelineStage) =>
    startTransition(async () => {
      const result = await changePipelineAction({ ids, stage })
      if (!result.ok) {
        setError(result.error)
      } else {
        setNotice('Status comercial atualizado.')
        setSelected(new Set())
        // Patch the affected leads optimistically so the UI is instant.
        setLeads((prev) =>
          prev.map((l) => (ids.includes(l.id) ? { ...l, pipeline_stage: stage } : l))
        )
        // Refresh aggregates (contacted count etc.) without reloading the list.
        if (agg.campaign?.id) {
          startTransition(() => { void refreshAggregates(agg.campaign!.id) })
        }
      }
    })

  const controlCampaign = () =>
    startTransition(async () => {
      if (!agg.campaign) return
      const result = await campaignControlAction({
        id: agg.campaign.id,
        status: agg.campaign.status === 'paused' ? 'running' : 'paused',
      })
      if (!result.ok) {
        setError(result.error)
      } else {
        await refreshAggregates(agg.campaign.id)
      }
    })

  const contact = (channel: 'WhatsApp' | 'E-mail') =>
    setNotice(
      `${channel}: integração não configurada. Nenhuma mensagem foi enviada. ${selected.size ? `${selected.size} leads selecionados para uma futura campanha de contato.` : 'O envio por API oficial será habilitado em uma próxima etapa.'}`
    )

  const allChecked = leads.length > 0 && leads.every((l) => selected.has(l.id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const metricCards = [
    ['Encontrados', agg.metrics.found],
    ['Qualificados', agg.metrics.qualified],
    ['Alta prioridade', agg.metrics.highPriority],
    ['Contatados', agg.metrics.contacted],
    ['Responderam', agg.metrics.replied],
    ['Propostas', agg.metrics.proposals],
  ] as const

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-5 sm:px-6">
        {/* Campaign form — static, never re-renders due to polling */}
        <CampaignForm disabled={!canManage} busy={busy} onCreate={create} />
        {!canManage && (
          <p className="text-xs text-slate-500">
            Acesso de leitura. Para criar campanhas e atualizar leads, solicite a permissão
            Gerenciar Prospecção.
          </p>
        )}

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              className={buttonClass}
              onClick={() => {
                setLoading(true)
                startTransition(() => { void load(filters) })
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Notice banner */}
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

        {/* Campaign selector + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-slate-500" htmlFor="current-campaign">
              Campanha
            </label>
            <select
              id="current-campaign"
              value={agg.campaign?.id ?? ''}
              onChange={(e) =>
                changeFilters({ campaignId: e.target.value, page: 1, sort: 'score' })
              }
              className={`${inputClass} max-w-full`}
              disabled={!campaigns.length}
            >
              <option value="" disabled>
                Nenhuma campanha
              </option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {segments[c.segment as Segment]?.label ?? c.segment} · {c.city}/{c.state} ·{' '}
                  {dateLabel(c.created_at)}
                </option>
              ))}
            </select>
            {agg.campaign && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${agg.campaign.status === 'running' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'}`}
              >
                {statusLabels[agg.campaign.status]}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {canManage &&
              agg.campaign &&
              ['running', 'paused'].includes(agg.campaign.status) && (
                <button onClick={controlCampaign} disabled={busy} className={buttonClass}>
                  {agg.campaign.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                  {agg.campaign.status === 'paused' ? 'Retomar' : 'Pausar'}
                </button>
              )}
            <button
              title="Atualizar dados"
              aria-label="Atualizar dados"
              disabled={busy}
              onClick={() => {
                setLoading(true)
                startTransition(() => { void load(filters) })
              }}
              className={buttonClass}
            >
              <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Metric cards — updated by aggregate poller */}
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

        {/* Campaign progress strip */}
        {agg.campaign && (
          <div
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600"
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>
                Encontrados: <strong>{agg.metrics.found}</strong>
              </span>
              <span>
                Enriquecidos: <strong>{agg.metrics.enriched}</strong>
              </span>
              <span>
                Auditados: <strong>{agg.metrics.audited}</strong>
              </span>
              <span>
                Qualificados: <strong>{agg.metrics.qualified}</strong> (score ≥{' '}
                {agg.campaign.min_score})
              </span>
            </div>
            <p className="mt-2">
              {agg.campaign.status === 'running'
                ? 'Estamos analisando as empresas encontradas. Novos leads aparecerão nesta lista automaticamente.'
                : agg.campaign.status === 'paused'
                  ? 'Processamento pausado. Etapas já em execução podem terminar; novos jobs aguardam a retomada.'
                  : agg.campaign.discovery_note}
            </p>
          </div>
        )}

        {/* Job error details */}
        {agg.jobs.some((j) => j.error_message) && (
          <details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-amber-900">
              Pendências de processamento
            </summary>
            <ul className="mt-3 space-y-3">
              {agg.jobs
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
                              else if (agg.campaign?.id) await refreshAggregates(agg.campaign.id)
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

        {/* Filters — static structure, changeFilters triggers load() */}
        <LeadFiltersPanel filters={filters} onChange={changeFilters} />

        {/* Lead table */}
        <section
          aria-label="Leads encontrados"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Leads</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {total}
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
                        setSelected(allChecked ? new Set() : new Set(leads.map((l) => l.id)))
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
                {leads.map((lead) => (
                  <LeadTableRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selected.has(lead.id)}
                    canManage={canManage}
                    busy={busy}
                    onToggle={toggle}
                    onDetail={setDetailId}
                    onStageChange={changeStage}
                    onContact={contact}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 && (
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
                    : !agg.campaign
                      ? 'Nenhuma campanha executada ainda.'
                      : 'Nenhum lead encontrado com esses filtros.'}
              </p>
              <p className="max-w-lg text-sm text-slate-500">
                {!agg.campaign
                  ? 'Selecione segmento e localização acima para encontrar suas primeiras oportunidades.'
                  : agg.campaign.status === 'running'
                    ? 'Os resultados aparecerão automaticamente conforme o processamento avançar.'
                    : 'Ajuste os filtros para consultar outras oportunidades.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Página {filters.page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} leads
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
                disabled={filters.page * PAGE_SIZE >= total || loading}
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
          onChanged={() => {
            // The drawer mutated a lead — the Realtime subscription will
            // deliver the change automatically. No manual load() needed.
          }}
        />
      )}
    </div>
  )
}
