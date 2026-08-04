export interface PricingConfig {
  baseRates: Record<string, number>
  perPageRate: number
  perCustomPageRate: number
  perProductRate: number
  perFormRate: number
  complexityMultipliers: Record<string, number>
  urgencyMultipliers: Record<string, number>
  defaultMarginPercent: number
  taxPercent: number
  maxDiscountPercent: number
}

export interface QuoteFormData {
  clientName: string
  company?: string
  projectName: string
  projectType: string
  platform?: string
  desiredDeadline?: string
  pageCount: number
  customPageCount: number
  productCount: number
  formCount: number
  hasRestrictedArea: boolean
  hasBlog: boolean
  hasIntegrations: boolean
  complexity: 'Simples' | 'Intermediária' | 'Avançada' | 'Personalizada'
  designLevel: 'Estrutura existente' | 'Personalização de template' | 'Design personalizado' | 'Design do zero'
  contentOption: 'Cliente fornece' | 'Revisão/Adaptação' | 'Criação de Copy & Imagens'
  urgency: 'Sem urgência' | 'Prazo normal' | 'Urgente' | 'Prioridade máxima'
  discountAmount: number
  additionalCosts: number
  taxPercent: number
  notes?: string
  paymentTerms?: string
}

export interface CalculationBreakdown {
  baseValue: number
  pagesValue: number
  featuresValue: number
  designValue: number
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
  project_type: string
  platform?: string
  form_data: QuoteFormData
  pricing_snapshot: PricingConfig
  calculation_breakdown: CalculationBreakdown
  subtotal: number
  discount: number
  additional_costs: number
  taxes: number
  final_value: number
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado'
  notes?: string
  created_by_name?: string
  created_at: string
}
