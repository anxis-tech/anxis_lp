import type {
  Business,
  DigitalPresence,
  OpportunityType,
  QualificationStatus,
} from '../types/index.ts'
export type ScoreGroup = 'business' | 'site' | 'system' | 'commercial' | 'penalties'
export interface Rule {
  code: string
  name: string
  description: string
  score_group: ScoreGroup
  points: number
  config: {
    field: string
    op: 'eq' | 'lt' | 'gte' | 'between'
    value: number | boolean | string
    max?: number
  }
  enabled: boolean
  priority: number
  campaign_id: string | null
}
export interface ScoringInput {
  business: Business
  digital: DigitalPresence
  segment: { priority: number; booking: boolean; clientArea: boolean; highTicket: boolean }
  aiThreshold: number
  campaignId?: string
}
export interface ScoreItem {
  code: string
  group: ScoreGroup
  points: number
  explanation: string
}
export interface ScoreResult {
  version: string
  business: number
  site: number
  system: number
  opportunity: number
  commercial: number
  penalties: number
  final: number
  classification: 'discarded' | 'low' | 'opportunity' | 'qualified' | 'high'
  qualificationStatus: QualificationStatus
  opportunityType: OpportunityType
  useAI: boolean
  eliminated: boolean
  items: ScoreItem[]
}
