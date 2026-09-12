import type { ScoreResult } from './types.ts'
export function classify(
  score: number
): Pick<ScoreResult, 'classification' | 'qualificationStatus'> {
  if (score < 40) return { classification: 'discarded', qualificationStatus: 'discarded' }
  if (score < 55) return { classification: 'low', qualificationStatus: 'audited' }
  if (score < 70) return { classification: 'opportunity', qualificationStatus: 'opportunity' }
  if (score < 85) return { classification: 'qualified', qualificationStatus: 'qualified' }
  return { classification: 'high', qualificationStatus: 'highly_qualified' }
}
export const classificationLabels = {
  discarded: 'Descartado',
  low: 'Baixa prioridade',
  opportunity: 'Oportunidade',
  qualified: 'Qualificado',
  high: 'Alta prioridade',
} as const
