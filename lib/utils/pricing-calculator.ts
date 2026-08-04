import { PricingConfig, QuoteFormData, CalculationBreakdown } from '@/types/pricing.types'

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseRates: {
    'Landing Page': 2500,
    'Site Institucional': 4500,
    'Loja Virtual': 6500,
    'Reformulação': 3500,
    'Desenvolvimento Personalizado': 8500,
    'Integração': 2000,
  },
  perPageRate: 350,
  perCustomPageRate: 600,
  perProductRate: 5,
  perFormRate: 200,
  complexityMultipliers: {
    'Simples': 1.0,
    'Intermediária': 1.25,
    'Avançada': 1.5,
    'Personalizada': 2.0,
  },
  urgencyMultipliers: {
    'Sem urgência': 1.0,
    'Prazo normal': 1.0,
    'Urgente': 1.3,
    'Prioridade máxima': 1.6,
  },
  defaultMarginPercent: 20,
  taxPercent: 8,
  maxDiscountPercent: 15,
}

export function calculateProjectQuote(
  form: QuoteFormData,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): CalculationBreakdown {
  // 1. Base Rate
  const baseValue = config.baseRates[form.projectType] || 3500

  // 2. Pages Cost
  const pagesValue =
    (form.pageCount || 0) * config.perPageRate +
    (form.customPageCount || 0) * config.perCustomPageRate

  // 3. Features Cost
  let featuresValue =
    (form.productCount || 0) * config.perProductRate +
    (form.formCount || 0) * config.perFormRate

  if (form.hasRestrictedArea) featuresValue += 1500
  if (form.hasBlog) featuresValue += 800
  if (form.hasIntegrations) featuresValue += 1200

  // 4. Design Level Cost
  let designValue = 0
  if (form.designLevel === 'Personalização de template') designValue = 500
  else if (form.designLevel === 'Design personalizado') designValue = 1800
  else if (form.designLevel === 'Design do zero') designValue = 3500

  // 5. Content Cost
  let contentValue = 0
  if (form.contentOption === 'Revisão/Adaptação') contentValue = 600
  else if (form.contentOption === 'Criação de Copy & Imagens') contentValue = 1800

  // 6. Multipliers
  const complexityMultiplier = config.complexityMultipliers[form.complexity] || 1.0
  const urgencyMultiplier = config.urgencyMultipliers[form.urgency] || 1.0

  // 7. Raw Subtotal
  const rawTotal = (baseValue + pagesValue + featuresValue + designValue + contentValue) *
    complexityMultiplier *
    urgencyMultiplier

  const subtotal = Math.round(rawTotal * 100) / 100

  // 8. Adjustments
  const discount = Math.min(form.discountAmount || 0, (subtotal * config.maxDiscountPercent) / 100)
  const additionalCosts = form.additionalCosts || 0
  const taxableAmount = subtotal - discount + additionalCosts
  const taxes = Math.round(((taxableAmount * (form.taxPercent || config.taxPercent)) / 100) * 100) / 100

  const finalValue = Math.round((taxableAmount + taxes) * 100) / 100

  return {
    baseValue,
    pagesValue,
    featuresValue,
    designValue,
    contentValue,
    complexityMultiplier,
    urgencyMultiplier,
    subtotal,
    discount,
    additionalCosts,
    taxes,
    finalValue,
  }
}
