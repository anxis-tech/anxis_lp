'use client'
import { Filter, RotateCcw } from 'lucide-react'
import type { LeadFilters } from '../schemas/lead.schema'
import { segments, states } from '../schemas/campaign.schema'
import { pipelineLabels, pipelineStages } from '../types/index'
import { buttonClass, inputClass, opportunityLabels } from './shared'
import { classificationLabels } from '../scoring/classification'
const quickFilters = [
  ['high', 'Alta prioridade'],
  ['none', 'Sem site'],
  ['bad', 'Site ruim'],
  ['booking', 'Sem agendamento'],
  ['whatsapp', 'WhatsApp como único CTA'],
  ['ai', 'Analisados pela IA'],
] as const
export function LeadFiltersPanel({
  filters,
  onChange,
}: {
  filters: LeadFilters
  onChange: (filters: LeadFilters) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {quickFilters.map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filters.quick === value}
            onClick={() =>
              onChange({ ...filters, page: 1, quick: filters.quick === value ? undefined : value })
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filters.quick === value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <details className="rounded-lg border border-slate-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
          <Filter size={15} />
          Filtros avançados
        </summary>
        <form
          key={JSON.stringify(filters)}
          onSubmit={(event) => {
            event.preventDefault()
            const entries = [...new FormData(event.currentTarget).entries()].filter(
              ([, value]) => value !== ''
            )
            const values = Object.fromEntries(entries)
            onChange({
              campaignId: filters.campaignId,
              page: 1,
              sort: filters.sort,
              quick: filters.quick,
              ...values,
            } as LeadFilters)
          }}
          className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 md:grid-cols-4 xl:grid-cols-7"
        >
          <Field label="Score de">
            <input
              name="minScore"
              type="number"
              min="0"
              max="100"
              defaultValue={filters.minScore}
              className={inputClass}
            />
          </Field>
          <Field label="Score até">
            <input
              name="maxScore"
              type="number"
              min="0"
              max="100"
              defaultValue={filters.maxScore}
              className={inputClass}
            />
          </Field>
          <Field label="Classificação">
            <select
              name="classification"
              defaultValue={filters.classification ?? ''}
              className={inputClass}
            >
              <option value="">Todas</option>
              {Object.entries(classificationLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Oportunidade">
            <select
              name="opportunity"
              defaultValue={filters.opportunity ?? ''}
              className={inputClass}
            >
              <option value="">Todas</option>
              {Object.entries(opportunityLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Segmento">
            <select name="segment" defaultValue={filters.segment ?? ''} className={inputClass}>
              <option value="">Todos</option>
              {Object.entries(segments).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cidade">
            <input name="city" maxLength={100} defaultValue={filters.city} className={inputClass} />
          </Field>
          <Field label="Estado">
            <select name="state" defaultValue={filters.state ?? ''} className={inputClass}>
              <option value="">Todos</option>
              {states.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Website">
            <select name="website" defaultValue={filters.website ?? ''} className={inputClass}>
              <option value="">Todos</option>
              <option value="yes">Possui site</option>
              <option value="none">Sem site</option>
              <option value="social">Somente social</option>
              <option value="bad">Site ruim</option>
            </select>
          </Field>
          <Field label="Rating mínimo">
            <input
              name="minRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              defaultValue={filters.minRating}
              className={inputClass}
            />
          </Field>
          <Field label="Avaliações mínimas">
            <input
              name="minReviews"
              type="number"
              min="0"
              defaultValue={filters.minReviews}
              className={inputClass}
            />
          </Field>
          <Field label="Status comercial">
            <select name="pipeline" defaultValue={filters.pipeline ?? ''} className={inputClass}>
              <option value="">Todos</option>
              {pipelineStages.map((v) => (
                <option key={v} value={v}>
                  {pipelineLabels[v]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Análise da IA">
            <select name="ai" defaultValue={filters.ai ?? ''} className={inputClass}>
              <option value="">Todas</option>
              <option value="yes">Analisados</option>
              <option value="no">Não analisados</option>
            </select>
          </Field>
          <Field label="Descoberto a partir de">
            <input name="since" type="date" defaultValue={filters.since} className={inputClass} />
          </Field>
          <div className="flex items-end gap-2">
            <button className={buttonClass}>Aplicar</button>
            <button
              type="reset"
              title="Limpar filtros"
              aria-label="Limpar filtros"
              onClick={() => onChange({ campaignId: filters.campaignId, page: 1, sort: 'score' })}
              className={buttonClass}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </form>
      </details>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-600">
      {label}
      {children}
    </label>
  )
}
