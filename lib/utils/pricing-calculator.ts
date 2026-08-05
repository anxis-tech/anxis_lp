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
  contentRates: {
    'Cliente fornecerá todo o conteúdo': 0,
    'Revisão de conteúdo': 400,
    'Adaptação de conteúdo': 800,
    'Criação completa de copy': 1800,
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
  const baseValue = config.baseRates[form.projectType] || 2500

  // 2. Pages Cost (Standard & Additional)
  const isNoStandardPageType =
    form.projectType === 'Loja virtual' ||
    form.projectType === 'Blog' ||
    form.projectType === 'Integração ou funcionalidade'

  const actualStandardPages = isNoStandardPageType ? 0 : (form.pageCount || 0)

  const pagesValue = actualStandardPages * (config.perPageRate || 350)
  const additionalPagesValue = (form.additionalPageCount || 0) * (config.perAdditionalPageRate || 500)

  // 3. Custom Code & Blog Module Fees (Step 2 Checkboxes)
  const customCodeValue = form.hasCustomCode ? (config.customCodeRate || 3500) : 0
  const blogModuleValue = (form.hasBlogModule && form.projectType !== 'Blog') ? (config.blogModuleRate || 1200) : 0

  // 4. Content Cost
  const contentValue = config.contentRates[form.contentOption] ?? 0

  // 5. Multipliers
  const complexityMultiplier = config.complexityMultipliers[form.complexity] || 1.0
  const urgencyMultiplier = config.urgencyMultipliers[form.urgency] || 1.0

  // 6. Raw Subtotal
  const rawTotal =
    (baseValue + pagesValue + additionalPagesValue + customCodeValue + blogModuleValue + contentValue) *
    complexityMultiplier *
    urgencyMultiplier

  const subtotal = Math.round(rawTotal * 100) / 100

  // 7. Adjustments & Taxes
  const maxDiscount = (subtotal * (config.maxDiscountPercent || 15)) / 100
  const discount = Math.min(form.discountAmount || 0, maxDiscount)
  const additionalCosts = form.additionalCosts || 0

  const taxableAmount = Math.max(0, subtotal - discount + additionalCosts)
  const taxes = Math.round(((taxableAmount * (form.taxPercent || config.taxPercent || 8)) / 100) * 100) / 100

  const finalValue = Math.round((taxableAmount + taxes) * 100) / 100

  return {
    baseValue,
    pagesValue,
    additionalPagesValue,
    customCodeValue,
    blogModuleValue,
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
