export type ClientProjectStatus =
  | 'Novo projeto'
  | 'Em desenvolvimento'
  | 'Aguardando revisão'
  | 'Concluído'

export type ClientProjectPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente'

export type FileCategory =
  | 'Identidade visual'
  | 'Imagens'
  | 'Copy'
  | 'Documentos'
  | 'Referências'
  | 'Contratos'
  | 'Materiais do cliente'
  | 'Entregas'
  | 'Outros'

export type ContentStatus =
  | 'Não solicitado'
  | 'Aguardando cliente'
  | 'Recebido parcialmente'
  | 'Recebido'
  | 'Em revisão'
  | 'Aprovado'

export interface KanbanStage {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  display_order: number
  is_active: boolean
  is_initial?: boolean
  is_completed?: boolean
}

export interface ClientProjectFile {
  id: string
  project_id: string
  file_name: string
  storage_path: string
  file_type?: string
  file_size?: number
  category: FileCategory
  description?: string
  uploaded_by?: string
  created_at: string
}

export interface ClientProjectLink {
  id: string
  project_id: string
  label: string
  url: string
  category?: string
  description?: string
  created_at: string
}

export interface ClientProjectTask {
  id: string
  project_id: string
  title: string
  description?: string
  responsible_user_id?: string
  responsible_user_name?: string
  status: 'Pendente' | 'Em andamento' | 'Bloqueada' | 'Concluída'
  priority: 'Baixa' | 'Normal' | 'Alta' | 'Urgente'
  deadline?: string
  completed_at?: string
  created_at: string
}

export interface ClientProjectActivity {
  id: string
  project_id: string
  user_id?: string
  user_name?: string
  action: string
  entity_type?: string
  previous_data?: any
  new_data?: any
  created_at: string
}

export interface ClientProject {
  id: string
  title: string
  client_name: string
  company?: string
  email?: string
  phone?: string
  whatsapp?: string
  project_type: string
  platform?: string
  status: ClientProjectStatus
  kanban_stage_id?: string
  kanban_stage_name?: string
  kanban_stage_color?: string
  kanban_position?: number
  priority: ClientProjectPriority
  responsible_user_id?: string
  responsible_user_name?: string
  responsible_user_email?: string
  responsible_user_role?: string
  participants?: { user_id: string; full_name: string; email: string }[]
  start_date?: string
  deadline?: string
  estimated_completion_date?: string
  description?: string
  internal_notes?: string

  // Financial & Payment Fields
  payment_status?: string
  approved_value?: number
  paid_value?: number
  payment_link?: string
  payment_method?: string
  paid_at?: string

  // Contact Details Section
  client_contact_json?: {
    contact_name?: string
    company?: string
    email?: string
    phone?: string
    whatsapp?: string
    role?: string
    best_time_to_contact?: string
    preferred_channel?: string
    contact_notes?: string
  }

  // Scope & Briefing Section
  scope_briefing_json?: {
    objective?: string
    target_audience?: string
    segment?: string
    problem_to_solve?: string
    requested_pages?: string[]
    requested_features?: string[]
    requested_integrations?: string[]
    visual_references?: string[]
    reference_sites?: string[]
    competitors?: string[]
    technical_requirements?: string
    client_notes?: string
    in_scope?: string[]
    out_of_scope?: string[]
    approval_criteria?: string
    pending_items?: string[]
  }

  // Content & Copy Section
  content_copy_json?: {
    main_copy?: string
    client_texts?: string
    page_structure?: string
    ctas?: string
    institutional_info?: string
    products_services?: string
    content_notes?: string
    content_status?: ContentStatus
  }

  // Linked Quote & Scope Section
  quote_id?: string
  quote_data?: {
    quote_id: string
    project_type: string
    page_count: number
    additional_page_count: number
    content_option: string
    urgency: string
    contracted_items?: string[]
    base_value: number
    discount_amount: number
    additional_costs: number
    tax_amount: number
    final_value: number
    notes?: string
    created_at?: string
  }

  files?: ClientProjectFile[]
  links?: ClientProjectLink[]
  tasks?: ClientProjectTask[]
  activity_history?: ClientProjectActivity[]
  deadline_status?: 'Dentro do prazo' | 'Próximo do prazo' | 'Atrasado' | 'Sem prazo definido'

  created_at: string
  updated_at: string
}
