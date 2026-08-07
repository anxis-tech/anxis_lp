import { PricingConfig, QuoteFormData, CalculationBreakdown } from '@/types/pricing.types'

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseRates: {
    'Landing page': 2500,
    'Página de vendas': 3200,
    'Site institucional': 4500,
    'Loja virtual': 6500,
    'Blog': 3800,
    'Integração ou funcionalidade': 2500,
  },
  perPageRate: 350,
  perAdditionalPageRate: 500,
  customCodeRate: 3500,
  blogModuleRate: 1200,
  urgencyMultipliers: {
    'Sem urgência': 1.0,
    'Urgente': 1.3,
    'Prioridade máxima': 1.6,
  },
  contentRates: {
    'Cliente fornecerá todo o conteúdo': 0,
    'Revisão de conteúdo': 400,
    'Adaptação de conteúdo': 800,
    'Criação completa de copy': 1800,
  },
  defaultMarginPercent: 20,
}

export function calculateProjectQuote(
  form: QuoteFormData,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): CalculationBreakdown {
  // 1. Base Rate (Includes standard page count for the selected project type)
  const baseValue = config.baseRates[form.projectType] || 2500

  // 2. Additional Pages Cost (Standard pages are included in baseValue; only additional pages generate extra cost)
  const pagesValue = 0 // Standard pages are part of baseValue and displayed informatively
  const additionalPagesValue = (form.additionalPageCount || 0) * (config.perAdditionalPageRate || 500)

  // 3. Custom Code & Blog Module Fees
  const customCodeValue = form.hasCustomCode ? (config.customCodeRate || 3500) : 0
  const blogModuleValue = (form.hasBlogModule && form.projectType !== 'Blog') ? (config.blogModuleRate || 1200) : 0

  // 4. Content Cost
  const contentValue = config.contentRates[form.contentOption] ?? 0

  // 5. Urgency Multiplier
  const urgencyMultiplier = config.urgencyMultipliers[form.urgency] || 1.0

  // 6. Raw Total (Base + Additional Pages + Extra Modules + Copy Content) * Urgency Multiplier
  const rawTotal =
    (baseValue + additionalPagesValue + customCodeValue + blogModuleValue + contentValue) *
    urgencyMultiplier

  const additionalCosts = form.additionalCosts || 0
  const finalValue = Math.round((rawTotal + additionalCosts) * 100) / 100
  const subtotal = finalValue

  return {
    baseValue,
    pagesValue,
    additionalPagesValue,
    customCodeValue,
    blogModuleValue,
    contentValue,
    urgencyMultiplier,
    subtotal,
    additionalCosts,
    finalValue,
  }
}
