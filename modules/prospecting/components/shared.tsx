import { classificationLabels } from '../scoring/classification'
import type { LeadRow, OpportunityType, QualificationStatus } from '../types/index'
export const inputClass =
  'min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0075FF] focus:ring-2 focus:ring-blue-100 disabled:opacity-50'
export const buttonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
export const primaryClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0075FF] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
export const opportunityLabels: Record<OpportunityType, string> = {
  website: 'Site',
  redesign: 'Redesign',
  software: 'Sistema',
  automation: 'Automação',
  website_and_software: 'Site + Sistema',
}
export const qualificationLabels: Record<QualificationStatus, string> = {
  discovered: 'Descoberto',
  enriching: 'Enriquecendo',
  enriched: 'Enriquecido',
  auditing: 'Auditando',
  audited: 'Auditado',
  opportunity: 'Oportunidade',
  qualified: 'Qualificado',
  highly_qualified: 'Alta prioridade',
  discarded: 'Descartado',
  error: 'Falha no processamento',
}
export function ScoreBadge({
  lead,
}: {
  lead: Pick<LeadRow, 'current_score' | 'classification' | 'manually_discarded'>
}) {
  const label = lead.manually_discarded
    ? 'Descartado manualmente'
    : classificationLabels[lead.classification as keyof typeof classificationLabels]
  const score = lead.current_score
  const color =
    lead.manually_discarded || score === null
      ? 'bg-slate-100 text-slate-600'
      : score >= 85
        ? 'bg-emerald-50 text-emerald-700'
        : score >= 70
          ? 'bg-blue-50 text-blue-700'
          : score >= 55
            ? 'bg-amber-50 text-amber-800'
            : 'bg-slate-100 text-slate-600'
  return (
    <span
      title={label ?? 'Aguardando score'}
      className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${color}`}
    >
      {score ?? '—'}
      {score !== null && ' / 100'}
    </span>
  )
}
export function dateLabel(value: string | null) {
  return value
    ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Nunca'
}
export function safeLink(value: string | null | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}
export function observed(value: boolean | undefined | null) {
  return value === undefined || value === null ? 'Não verificado' : value ? 'Sim' : 'Não detectado'
}
