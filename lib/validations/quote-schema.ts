import { z } from 'zod'

export const STRICT_PROJECT_TYPES = [
  'Landing page',
  'Página de vendas',
  'Site institucional',
  'Loja virtual',
  'Blog',
  'Integração ou funcionalidade',
] as const

export type StrictProjectType = typeof STRICT_PROJECT_TYPES[number]

export const CONTENT_COPY_OPTIONS = [
  'Cliente fornecerá todo o conteúdo',
  'Revisão de conteúdo',
  'Adaptação de conteúdo',
  'Criação completa de copy',
] as const

export type ContentCopyOption = typeof CONTENT_COPY_OPTIONS[number]

export const URGENCY_OPTIONS = [
  'Sem urgência',
  'Urgente',
  'Prioridade máxima',
] as const

export type UrgencyOption = typeof URGENCY_OPTIONS[number]

export const QUOTE_STATUSES = [
  'Rascunho',
  'Enviado',
  'Em Negociação',
  'Aprovado',
  'Recusado',
  'Convertido em Projeto',
] as const

export type QuoteStatus = typeof QUOTE_STATUSES[number] | (string & {})

export const quoteFormSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  company: z.string().optional(),
  projectName: z.string().min(1, 'Nome do projeto é obrigatório'),
  projectType: z.enum(STRICT_PROJECT_TYPES),
  platform: z.string().optional(),
  desiredDeadline: z.string().optional(),
  pageCount: z.number().min(0, 'Quantidade não pode ser negativa'),
  additionalPageCount: z.number().min(0, 'Quantidade não pode ser negativa'),
  hasCustomCode: z.boolean().optional(),
  hasBlogModule: z.boolean().optional(),
  contentOption: z.enum(CONTENT_COPY_OPTIONS),
  urgency: z.enum(URGENCY_OPTIONS),
  additionalCosts: z.number().min(0),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
})

export type QuoteFormSchemaType = z.infer<typeof quoteFormSchema>
