export type LeadStatus = 'Novo' | 'Em contato' | 'Orçamento' | 'Fechado' | 'Perdido'

export type LeadLossReason =
  | 'Valor'
  | 'Prazo'
  | 'Sem retorno'
  | 'Escolheu outro fornecedor'
  | 'Projeto cancelado'
  | 'Outro'

export type LeadActivityType =
  | 'criacao'
  | 'ligacao'
  | 'whatsapp'
  | 'email'
  | 'reuniao'
  | 'observacao'
  | 'follow_up'
  | 'alteracao_status'
  | 'alteracao_responsavel'
  | 'orcamento_criado'
  | 'fechamento'
  | 'conversao_projeto'
  | 'perdido'

export interface LeadActivity {
  id: string
  lead_id: string
  user_id?: string | null
  user_name?: string | null
  activity_type: LeadActivityType
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Lead {
  id: string
  name: string
  company?: string | null
  email: string
  whatsapp: string
  phone?: string | null
  project_type: string
  current_platform?: string | null
  budget_range?: string | null
  desired_deadline?: string | null
  initial_message?: string | null
  status: LeadStatus
  commercial_user_id?: string | null
  commercial_user_name?: string | null
  loss_reason?: LeadLossReason | string | null
  loss_notes?: string | null
  source: string // 'Landing Page' | 'Manual'
  landing_page?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  gclid?: string | null
  fbclid?: string | null
  last_interaction_at?: string | null
  created_by?: string | null
  created_by_name?: string | null
  updated_by?: string | null
  updated_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface LeadFilterOptions {
  status?: string // 'todos' | LeadStatus | 'meus_leads'
  commercialUserId?: string
  projectType?: string
  source?: string
  period?: 'hoje' | 'ultimos_7_dias' | 'este_mes' | 'mes_anterior' | 'este_ano' | 'todos'
  searchTerm?: string
  onlyMyLeads?: boolean
}
