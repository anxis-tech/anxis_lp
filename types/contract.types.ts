export type ContractStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Contract {
  id: string
  project_id: string
  quote_id?: string | null
  status: ContractStatus
  client_data_snapshot: {
    client_name?: string
    company?: string
    email?: string
    phone?: string
    whatsapp?: string
    contact_name?: string
    contact_role?: string
  }
  project_data_snapshot: {
    title?: string
    project_type?: string
    platform?: string
    description?: string
    scope_objective?: string
    target_audience?: string
    start_date?: string
    deadline?: string
    responsible_name?: string
  }
  pricing_snapshot: {
    project_type?: string
    page_count?: number
    additional_page_count?: number
    content_option?: string
    urgency?: string
    base_value?: number
    discount_amount?: number
    additional_costs?: number
    tax_amount?: number
    final_value?: number
    notes?: string
  }
  final_value: number
  storage_path?: string | null
  file_name?: string | null
  file_size?: number
  version: number
  generated_at?: string | null
  error_message?: string | null
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ContractGenerationJob {
  id: string
  contract_id: string
  project_id: string
  status: ContractStatus
  attempts: number
  started_at?: string | null
  completed_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}
