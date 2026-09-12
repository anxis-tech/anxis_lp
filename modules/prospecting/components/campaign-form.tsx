'use client'
import { useState } from 'react'
import { Plus, LoaderCircle } from 'lucide-react'
import { segments, states } from '../schemas/campaign.schema'
import { inputClass, primaryClass } from './shared'
export function CampaignForm({
  disabled,
  busy,
  onCreate,
}: {
  disabled: boolean
  busy: boolean
  onCreate: (data: unknown) => void
}) {
  const [segment, setSegment] = useState('dentist')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        onCreate({
          segment: data.get('segment'),
          customSegment: data.get('customSegment') || undefined,
          city: data.get('city'),
          state: data.get('state'),
          volume: Number(data.get('volume')),
          min_score: Number(data.get('min_score')),
          ai_score_threshold: Number(data.get('ai_score_threshold')),
        })
      }}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <fieldset disabled={disabled || busy} className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Segmento
          <select
            name="segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className={inputClass}
          >
            {Object.entries(segments).map(([id, v]) => (
              <option key={id} value={id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        {segment === 'other' && (
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Qual segmento?
            <input
              name="customSegment"
              required
              minLength={2}
              maxLength={80}
              className={inputClass}
            />
          </label>
        )}
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Cidade
          <input
            name="city"
            required
            placeholder="Ex.: Natal"
            minLength={2}
            maxLength={100}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Estado
          <select name="state" defaultValue="RN" className={inputClass}>
            {states.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Volume
          <select name="volume" className={inputClass}>
            {[100, 250, 500, 1000].map((v) => (
              <option key={v} value={v}>
                {v.toLocaleString('pt-BR')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Score mínimo
          <select name="min_score" defaultValue="55" className={inputClass}>
            {[0, 40, 55, 70, 85].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          IA a partir de
          <select name="ai_score_threshold" defaultValue="85" className={inputClass}>
            {[70, 75, 80, 85, 90, 95, 100].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={primaryClass}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}Gerar
          campanha
        </button>
      </fieldset>
      <p className="mt-3 text-xs text-slate-500">
        Brasil · O volume é uma meta e depende das empresas disponíveis na região. A análise
        continua em segundo plano.
      </p>
    </form>
  )
}
