import {
  StrictProjectType,
  ContentCopyOption,
  UrgencyOption,
  QuoteStatus,
} from '@/lib/validations/quote-schema'

export interface PricingConfig {
  baseRates: Record<StrictProjectType, number>
  perPageRate: number
  perAdditionalPageRate: number
  customCodeRate: number
  blogModuleRate: number
  complexityMultipliers: Record<string, number>
  urgencyMultipliers: Record<UrgencyOption, number>
  contentRates: Record<ContentCopyOption, number>
  defaultMarginPercent: number
  taxPercent: number
  maxDiscountPercent: number
}

export interface QuoteFormData {
  clientName: string
  company?: string
  projectName: string
  projectType: StrictProjectType
  platform?: string
  desiredDeadline?: string
  pageCount: number
  additionalPageCount: number
  hasCustomCode?: boolean
  hasBlogModule?: boolean
  complexity: 'Simples' | 'Intermediária' | 'Avançada' | 'Personalizada'
  contentOption: ContentCopyOption
  urgency: UrgencyOption
  discountAmount: number
  additionalCosts: number
  taxPercent: number
  notes?: string
  paymentTerms?: string
}

export interface CalculationBreakdown {
  baseValue: number
  pagesValue: number
  additionalPagesValue: number
  customCodeValue: number
  blogModuleValue: number
  contentValue: number
  complexityMultiplier: number
  urgencyMultiplier: number
  subtotal: number
  discount: number
  additionalCosts: number
  taxes: number
  finalValue: number
}

export interface SavedQuote {
  id: string
  client_name: string
  company?: string
  project_name: string
  project_type: StrictProjectType
  platform?: string
  form_data: QuoteFormData
  pricing_snapshot: PricingConfig
  calculation_breakdown: CalculationBreakdown
  subtotal: number
  discount: number
  additional_costs: number
  taxes: number
  final_value: number
  status: QuoteStatus
  notes?: string
  created_by_name?: string
  created_by_user_id?: string
  linked_project_id?: string
  created_at: string
  updated_at: string
}
